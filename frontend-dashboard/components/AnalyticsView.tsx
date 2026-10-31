'use client';
import { useState } from 'react';
import { Download, TrendingUp, TrendingDown, ShieldCheck, Activity } from 'lucide-react';
import { downloadCsv, inrCr } from '@/lib/export';
import { useApp } from '@/lib/store';
import { SYSTEM_METRICS, BRANCHES } from '@/lib/data';

const KPIS = [
  {
    label: 'Cases Reviewed',
    num: '847',
    delta: '12.3% vs previous 30d',
    up: true,
    points: '0,28 15,24 30,26 45,20 60,22 75,16 90,19 105,12 120,15',
    area: 'M0,28 L15,24 L30,26 L45,20 L60,22 L75,16 L90,19 L105,12 L120,15 L120,36 L0,36 Z',
  },
  {
    label: 'Fraud Prevented',
    num: '₹19.4 Cr',
    delta: '8.1% vs previous 30d',
    up: true,
    points: '0,24 15,22 30,25 45,18 60,19 75,15 90,12 105,14 120,8',
    area: 'M0,24 L15,22 L30,25 L45,18 L60,19 L75,15 L90,12 L105,14 L120,8 L120,36 L0,36 Z',
  },
  {
    label: 'Detection Rate',
    num: '94.21%',
    delta: '2.1% vs previous 30d',
    up: true,
    points: '0,22 15,25 30,20 45,18 60,16 75,18 90,12 105,10 120,6',
    area: 'M0,22 L15,25 L30,20 L45,18 L60,16 L75,18 L90,12 L105,10 L120,6 L120,36 L0,36 Z',
  },
  {
    label: 'Avg. Review Time',
    num: '4.2 min',
    delta: '15.3% vs previous 30d',
    up: true, // faster is better
    points: '0,10 15,12 30,16 45,18 60,20 75,22 90,25 105,24 120,28',
    area: 'M0,10 L15,12 L30,16 L45,18 L60,20 L75,22 L90,25 L105,24 L120,28 L120,36 L0,36 Z',
  },
];

const BRANCH_DISTRIBUTION = [
  { name: 'Kolkata-SaltLake', cases: 368, pct: 31, color: '#0d3a23' },
  { name: 'Mumbai-BKC', cases: 285, pct: 24, color: '#1d7347' },
  { name: 'Bengaluru-HSR', cases: 238, pct: 20, color: '#5dbd8b' },
  { name: 'Delhi-Connaught', cases: 178, pct: 15, color: '#f59f00' },
  { name: 'Chennai-Guindy', cases: 119, pct: 10, color: '#94a3b8' },
];

const TOP_INVESTIGATORS = [
  { name: 'Priya Raman', role: 'Senior Analyst', init: 'PR', score: 57, max: 60, bg: '#fbcfe8' },
  { name: 'Mateo Silva', role: 'Branch Analyst', init: 'MS', score: 51, max: 60, bg: '#bbf7d0' },
  { name: 'Noah Castell', role: 'Branch Analyst', init: 'NC', score: 48, max: 60, bg: '#fed7aa' },
  { name: 'Owen Mercer', role: 'Branch Analyst', init: 'OM', score: 42, max: 60, bg: '#fef08a' },
  { name: 'Hana Kobayashi', role: 'Branch Analyst', init: 'HK', score: 33, max: 60, bg: '#e9d5ff' },
];

// Activity heatmap levels (140 days = 20 weeks * 7 days)
const HEAT_LEVELS = [
  0, 2, 3, 1, 2, 0, 0,
  0, 1, 2, 3, 2, 0, 0,
  0, 2, 1, 0, 4, 1, 0,
  1, 4, 2, 1, 2, 2, 0,
  0, 2, 2, 3, 1, 1, 1,
  1, 1, 3, 4, 3, 1, 0,
  0, 3, 1, 2, 1, 0, 0,
  2, 4, 3, 2, 4, 3, 0,
  0, 1, 2, 2, 1, 0, 0,
  2, 3, 4, 3, 2, 1, 0,
  0, 2, 1, 0, 4, 2, 0,
  1, 3, 2, 4, 3, 1, 0,
  0, 2, 1, 3, 1, 0, 0,
  2, 4, 4, 3, 2, 1, 0,
  0, 1, 2, 1, 3, 0, 0,
  1, 3, 2, 4, 2, 1, 0,
  0, 2, 4, 3, 1, 0, 0,
  1, 4, 3, 2, 3, 1, 0,
  0, 1, 2, 4, 1, 0, 0,
  2, 3, 4, 3, 4, 2, 0,
];

// Decile distribution values
const BASELINE_DECILES = [4, 8, 14, 20, 24, 20, 14, 9, 5, 3];
const LIVE_DECILES = [5, 8, 13, 21, 23, 21, 13, 10, 4, 3];

export default function AnalyticsView() {
  const { say } = useApp();
  const [range, setRange] = useState<'7' | '30' | '90'>('30');
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);

  const handleExport = () => {
    downloadCsv('sentinel_riskops_analytics.csv', [
      ['Metric', 'Value', 'Delta / Status'],
      ['Total Warehouse Transactions', '6,362,620', 'Ground truth'],
      ['Cases Reviewed', '847', '+12.3%'],
      ['Total Fraud Prevented', inrCr(SYSTEM_METRICS.fraudPreventedTotal), '+8.1%'],
      ['Champion Detection Catch Rate', '94.21%', '+2.1%'],
      ['Average Review Time', '4.2 minutes', '-15.3%'],
      ['Model Drift Divergence Index', '0.042', 'Stable / Optimal'],
      ['Kolkata-SaltLake Share', '368 cases', '31%'],
      ['Mumbai-BKC Share', '285 cases', '24%'],
      ['Bengaluru-HSR Share', '238 cases', '20%'],
      ['Delhi-Connaught Share', '178 cases', '15%'],
      ['Chennai-Guindy Share', '119 cases', '10%'],
    ]);
    say('Exported fraud operations analytics CSV');
  };

  return (
    <div className="flex flex-col gap-5 page-transition">
      {/* Board Header matching Fernly layout */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[26px] font-bold tracking-tight text-tx leading-tight">
              Analytics &amp; System Health
            </h1>
            <span className="rounded-full bg-so px-2.5 py-0.5 text-[11px] font-bold text-ac border border-ac/20">
              Stability 99.8% · Optimal
            </span>
          </div>
          <p className="text-[13.5px] text-mu mt-0.5">
            Operational triage performance, engine calibration benchmarks, and model health.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-full bg-card border border-bd/80 p-1 shadow-xs">
            {(['7', '30', '90'] as const).map(d => (
              <button
                key={d}
                onClick={() => setRange(d)}
                className={`rounded-full px-3.5 py-1 text-[12px] font-semibold transition-all duration-200 cursor-pointer ${
                  range === d
                    ? 'bg-[#0d3a23] text-white shadow-xs'
                    : 'text-mu hover:text-tx'
                }`}
              >
                {d}D
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            className="flex min-h-[38px] items-center gap-2 rounded-full border border-bd bg-card px-4 text-[12.5px] font-semibold text-tx shadow-xs hover:bg-so/40 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards with Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {KPIS.map((k, i) => (
          <div
            key={i}
            className="relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-bd/80 bg-card p-5 shadow-xs interactive-hover"
          >
            <div>
              <p className="text-[12.5px] font-medium text-mu">{k.label}</p>
              <p className="num text-[28px] font-extrabold tracking-tight text-tx mt-1">
                {k.num}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    k.up ? 'text-ac bg-so' : 'text-rd bg-rb'
                  }`}
                >
                  {k.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  <span>{k.delta}</span>
                </span>
              </div>
            </div>

            {/* Sparkline SVG at card base */}
            <div className="w-[calc(100%+40px)] -mx-5 -mb-5 mt-4 h-12">
              <svg
                viewBox="0 0 120 36"
                preserveAspectRatio="none"
                className="w-full h-full overflow-hidden"
              >
                <path d={k.area} fill="#e3f2e9" className="dark:fill-[#1e2b24]" />
                <polyline
                  points={k.points}
                  fill="none"
                  stroke="#27865a"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Middle Row: Daily Ingestion Throughput & Cases by Branch Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Daily Throughput Chart (8 cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between rounded-[26px] border border-bd/80 bg-card p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-[16px] font-bold text-tx">Daily Case Ingestion Volume</h2>
              <p className="text-[12.5px] text-mu">
                Transactions evaluated per day (in thousands), 7-day moving average
              </p>
            </div>
            <div className="flex items-center gap-4 text-[12px] text-mu">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-2 w-4 rounded-full bg-[#27865a]" />
                Current Period
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-0.5 w-4 border-t-2 border-dashed border-[#8d9a92]" />
                Previous Period
              </span>
            </div>
          </div>

          {/* Area Chart SVG */}
          <div className="relative h-60 w-full">
            <svg
              viewBox="0 0 600 220"
              preserveAspectRatio="none"
              className="w-full h-full overflow-visible"
            >
              <defs>
                <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#27865a" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#27865a" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              <line x1="0" y1="40" x2="600" y2="40" stroke="#e3e7e4" strokeDasharray="3 3" />
              <line x1="0" y1="100" x2="600" y2="100" stroke="#e3e7e4" strokeDasharray="3 3" />
              <line x1="0" y1="160" x2="600" y2="160" stroke="#e3e7e4" strokeDasharray="3 3" />
              <line x1="0" y1="210" x2="600" y2="210" stroke="#e3e7e4" />

              {/* Previous Period Dashed Curve */}
              <path
                d="M0,130 C60,135 100,120 150,135 C200,150 250,125 300,120 C350,115 400,130 450,115 C500,100 550,130 600,125"
                fill="none"
                stroke="#8d9a92"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* Current Period Area & Line */}
              <path
                d="M0,120 C60,115 100,130 150,118 C200,105 250,125 300,100 C350,110 400,105 450,90 C500,100 550,95 600,105 L600,210 L0,210 Z"
                fill="url(#area-grad)"
              />
              <path
                d="M0,120 C60,115 100,130 150,118 C200,105 250,125 300,100 C350,110 400,105 450,90 C500,100 550,95 600,105"
                fill="none"
                stroke="#1d7347"
                strokeWidth="2.5"
              />

              {/* Key datapoint dots */}
              {[
                { cx: 0, cy: 120, label: 'Oct 2: 212k txns · 24 flags' },
                { cx: 150, cy: 118, label: 'Oct 9: 218k txns · 28 flags' },
                { cx: 300, cy: 100, label: 'Oct 17: 242k txns · 36 flags' },
                { cx: 450, cy: 90, label: 'Oct 24: 256k txns · 41 flags' },
                { cx: 600, cy: 105, label: 'Oct 31: 234k txns · 29 flags' },
              ].map((pt, idx) => (
                <circle
                  key={idx}
                  cx={pt.cx}
                  cy={pt.cy}
                  r="4.5"
                  fill="#ffffff"
                  stroke="#0d3a23"
                  strokeWidth="2"
                  className="cursor-pointer hover:scale-150 transition-transform"
                  onMouseEnter={() => setHoveredPoint(pt.label)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
            </svg>

            {/* Hover Tooltip */}
            {hoveredPoint && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 rounded-full bg-[#0d3a23] text-white px-3 py-1 text-[11.5px] font-bold shadow-md">
                {hoveredPoint}
              </div>
            )}
          </div>

          {/* X Axis Labels */}
          <div className="flex justify-between text-[11.5px] font-medium text-mu pt-2 border-t border-bd/40">
            <span>Oct 2</span>
            <span>Oct 9</span>
            <span>Oct 17</span>
            <span>Oct 24</span>
            <span>Oct 31</span>
          </div>
        </div>

        {/* Cases by Branch Donut (4 cols) */}
        <div className="lg:col-span-4 flex flex-col justify-between rounded-[26px] border border-bd/80 bg-card p-6 shadow-xs">
          <div>
            <h2 className="text-[16px] font-bold text-tx">Cases by Hub Branch</h2>
            <p className="text-[12.5px] text-mu">Regional triage workload breakdown</p>
          </div>

          {/* Donut SVG */}
          <div className="relative flex items-center justify-center my-4">
            <svg viewBox="0 0 160 160" className="w-44 h-44">
              <circle cx="80" cy="80" r="60" fill="none" stroke="#e3e7e4" strokeWidth="20" />
              {/* Segments */}
              <circle
                cx="80"
                cy="80"
                r="60"
                fill="none"
                stroke="#0d3a23"
                strokeWidth="20"
                strokeDasharray="116.8 377"
                strokeDashoffset="94"
              />
              <circle
                cx="80"
                cy="80"
                r="60"
                fill="none"
                stroke="#1d7347"
                strokeWidth="20"
                strokeDasharray="90.5 377"
                strokeDashoffset="-22.8"
              />
              <circle
                cx="80"
                cy="80"
                r="60"
                fill="none"
                stroke="#5dbd8b"
                strokeWidth="20"
                strokeDasharray="75.4 377"
                strokeDashoffset="-113.3"
              />
              <circle
                cx="80"
                cy="80"
                r="60"
                fill="none"
                stroke="#f59f00"
                strokeWidth="20"
                strokeDasharray="56.5 377"
                strokeDashoffset="-188.7"
              />
              <circle
                cx="80"
                cy="80"
                r="60"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="20"
                strokeDasharray="37.7 377"
                strokeDashoffset="-245.2"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="num text-[17px] font-extrabold text-tx leading-tight">
                1,188
              </span>
              <span className="text-[10.5px] font-semibold text-mu">cases · 30d</span>
            </div>
          </div>

          {/* Branch legend */}
          <div className="flex flex-col gap-2 pt-2 border-t border-bd/40">
            {BRANCH_DISTRIBUTION.map((b, i) => (
              <div key={i} className="flex items-center justify-between text-[12.5px]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                  <span className="font-semibold text-tx">{b.name}</span>
                </div>
                <span className="num font-bold text-mu">{b.cases} ({b.pct}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MERGED SYSTEM HEALTH: Score Distribution Stability */}
      <div className="rounded-[26px] border border-bd/80 bg-card p-6 shadow-xs flex flex-col gap-4">
        <div className="flex flex-wrap justify-between items-start gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-bold text-tx">Score Distribution Stability</h2>
              <span className="rounded-full bg-so px-2.5 py-0.5 text-[10.5px] font-bold text-ac border border-ac/15">
                Divergence: 0.042 (Negligible)
              </span>
            </div>
            <p className="text-[12.5px] text-mu mt-0.5">
              Evaluates live transaction risk score distributions against the 30-day baseline standard
            </p>
          </div>
          <div className="flex items-center gap-3 text-[12px] font-medium text-mu">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-so" /> Baseline Reference
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-[#0d3a23] dark:bg-[#155a37]" /> Current Stream
            </span>
          </div>
        </div>

        {/* 10 Decile Bar Pairs */}
        <div className="flex h-[160px] items-end gap-2 px-2 pt-4 border-b border-bd/60 pb-2">
          {BASELINE_DECILES.map((v, i) => (
            <div key={i} className="flex h-full flex-1 items-end gap-[3px]">
              <div
                className="anim-gr flex-1 rounded-t-sm bg-so"
                style={{ height: v * 4 + '%', animationDelay: i * 50 + 'ms' }}
                title={`Baseline Decile ${i + 1}: ${v}%`}
              />
              <div
                className="anim-gr flex-1 rounded-t-sm bg-[#0d3a23] dark:bg-[#155a37]"
                style={{ height: LIVE_DECILES[i] * 4 + '%', animationDelay: i * 50 + 25 + 'ms' }}
                title={`Live Stream Decile ${i + 1}: ${LIVE_DECILES[i]}%`}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-[12px] text-mu">
          <span>Decile 1 (Low Risk: 0.0 - 0.1)</span>
          <span className="font-semibold text-ac">Distribution Symmetry: 99.8% Consistent</span>
          <span>Decile 10 (High Risk: 0.9 - 1.0)</span>
        </div>
      </div>

      {/* MERGED SYSTEM HEALTH: Performance Benchmark Comparison */}
      <div className="rounded-[26px] border border-bd/80 bg-card p-6 shadow-xs">
        <h2 className="text-[16px] font-bold text-tx mb-1">Detection Engine Performance Benchmarks</h2>
        <p className="text-[12.5px] text-mu mb-4">
          Comparative analysis across 6,362,620 transactions in the historical test archive
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-bd/80 text-left text-[11.5px] font-semibold uppercase tracking-wider text-mu">
                <th className="py-2.5">Detection Engine Architecture</th>
                <th className="py-2.5 text-right">Detection Catch Rate</th>
                <th className="py-2.5 text-right">False Alarm Rate</th>
                <th className="py-2.5 text-right">Operational Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-bd/50 bg-so/30">
                <td className="py-3 font-semibold text-tx">
                  Active Behavioral Engine (Hybrid XGBoost + Autoencoder)
                </td>
                <td className="num py-3 text-right font-bold text-ac">94.21% Catch Rate</td>
                <td className="num py-3 text-right font-medium text-tx">0.82%</td>
                <td className="py-3 text-right">
                  <span className="rounded-full bg-so px-2.5 py-0.5 text-[11px] font-bold text-ac border border-ac/20">
                    Production Champion
                  </span>
                </td>
              </tr>
              <tr className="border-t border-bd/50">
                <td className="py-3 text-mu font-medium">Standard Baseline Engine</td>
                <td className="num py-3 text-right font-medium text-tx">78.10% Catch Rate</td>
                <td className="num py-3 text-right font-medium text-mu">2.14%</td>
                <td className="py-3 text-right text-mu text-[12px]">Reference Baseline</td>
              </tr>
              <tr className="border-t border-bd/50">
                <td className="py-3 text-mu font-medium">Legacy Static Rules (Threshold &gt; ₹2L)</td>
                <td className="num py-3 text-right font-medium text-rd">0.19% Catch Rate (16 flags)</td>
                <td className="num py-3 text-right font-medium text-mu">0.05%</td>
                <td className="py-3 text-right text-mu text-[12px]">Deprecated</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Row: 20-Week Review Heatmap & Top Investigators */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Review Activity Heatmap (8 cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between rounded-[26px] border border-bd/80 bg-card p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-[16px] font-bold text-tx">Review &amp; Decision Activity</h2>
              <p className="text-[12.5px] text-mu">
                Triage determinations and case escalations, last 20 weeks
              </p>
            </div>
            {/* Legend scale */}
            <div className="flex items-center gap-1.5 text-[11.5px] text-mu font-medium">
              <span>Less</span>
              <span className="h-3 w-3 rounded-xs bg-[#e3e7e4] dark:bg-[#26322C]" />
              <span className="h-3 w-3 rounded-xs bg-[#bbf7d0]" />
              <span className="h-3 w-3 rounded-xs bg-[#5dbd8b]" />
              <span className="h-3 w-3 rounded-xs bg-[#1d7347]" />
              <span className="h-3 w-3 rounded-xs bg-[#0d3a23]" />
              <span>More</span>
            </div>
          </div>

          {/* 20 Columns x 7 Rows Grid */}
          <div className="grid grid-rows-7 grid-flow-col gap-1.5 my-auto overflow-x-auto py-2">
            {HEAT_LEVELS.map((lvl, idx) => (
              <div
                key={idx}
                data-l={lvl}
                title={`Week ${Math.floor(idx / 7) + 1}, Day ${(idx % 7) + 1}: ${
                  lvl === 0 ? 'No activity' : lvl * 5 + ' case reviews'
                }`}
                className="heat-box h-4 w-4 rounded-[3.5px] transition-transform hover:scale-125 cursor-pointer"
              />
            ))}
          </div>

          <div className="text-[11.5px] text-mu mt-3">
            Showing 41 high-volume operational days out of 140 total trailing tracked days.
          </div>
        </div>

        {/* Top Investigators (4 cols) */}
        <div className="lg:col-span-4 flex flex-col justify-between rounded-[26px] border border-bd/80 bg-card p-6 shadow-xs">
          <div>
            <h2 className="text-[16px] font-bold text-tx">Top Reviewers</h2>
            <p className="text-[12.5px] text-mu">Resolved cases and triage efficiency</p>
          </div>

          <div className="flex flex-col gap-3.5 my-auto py-2">
            {TOP_INVESTIGATORS.map((c, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-tx shadow-2xs"
                      style={{ backgroundColor: c.bg }}
                    >
                      {c.init}
                    </span>
                    <div>
                      <span className="font-bold text-tx block leading-tight">{c.name}</span>
                      <span className="text-[10px] text-mu leading-none">{c.role}</span>
                    </div>
                  </div>
                  <span className="num font-bold text-ac">{c.score} resolved</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-so">
                  <div
                    className="h-full bg-[#1d7347] rounded-full transition-all duration-500"
                    style={{ width: `${(c.score / c.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11.5px] text-mu pt-2 border-t border-bd/40">
            Leaderboard resets automatically on monthly operational review boundary.
          </div>
        </div>
      </div>
    </div>
  );
}
