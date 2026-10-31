'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileCheck,
  Building,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { Case, useApp } from '@/lib/store';
import { BRANCHES, SYSTEM_METRICS } from '@/lib/data';
import { ROLES } from '@/lib/roles';
import { downloadCsv, inr, inrCr } from '@/lib/export';
import { Btn, Card, H1, Pill, Stats } from './ui';
import CaseList from './CaseList';

const useScope = () => {
  const a = useApp();
  return a.role === 'analyst'
    ? a.cases.filter(c => c.branch === ROLES.analyst.branch)
    : a.cases;
};

const open = (c: Case) => !c.res;
const byDue = (x: Case, y: Case) => (x.rem ?? 0) - (y.rem ?? 0);

export function HomeAnalyst() {
  const a = useApp();
  const [filter, setFilter] = useState<'all' | 'high' | 'urgent'>('all');
  const baseQueue = useScope().filter(c => c.kind === 'review' && open(c));

  const filteredQueue = baseQueue.filter(c => {
    if (filter === 'high') return c.amount >= 100000;
    if (filter === 'urgent') return c.score >= 0.55;
    return true;
  });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <H1>Analyst Workbench</H1>
        <span className="text-[12.5px] font-medium text-mu">
          Assigned Scope: <b className="text-tx">{ROLES.analyst.branch}</b>
        </span>
      </div>

      <Stats
        items={[
          ['Pending Review', baseQueue.length, 'In current queue'],
          ['Reviewed Today', a.stats.reviewed, 'Decisions recorded'],
          [
            'False-Positive Rate',
            a.stats.reviewed ? Math.round((a.stats.fp / a.stats.reviewed) * 100) + '%' : '0%',
            'Within 5% benchmark',
          ],
          ['Escalated to Senior', a.stats.escalated, 'High-severity flags'],
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-2.5 mt-1">
        <h2 className="text-[15px] font-bold text-tx">Live Ingestion Feed</h2>
        <div className="flex gap-1.5 bg-card border border-bd/80 p-1 rounded-full text-[12px]">
          {(
            [
              ['all', `All (${baseQueue.length})`],
              ['urgent', 'Priority Flags'],
              ['high', '₹1L+ High Value'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-3 py-1 rounded-full font-semibold transition cursor-pointer ${
                filter === k ? 'bg-ac text-on shadow-xs' : 'text-mu hover:text-tx'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <CaseList cases={filteredQueue} />

      <Card className="border-bd/70">
        <h2 className="mb-2.5 text-[14px] font-bold text-tx">Branch Operations Team</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12.5px]">
          <div className="flex items-center gap-2 rounded-xl bg-so/40 p-2.5 border border-bd/50">
            <span className="h-2.5 w-2.5 rounded-full bg-ac animate-pulse" />
            <div>
              <div className="font-semibold text-tx">Branch Analyst</div>
              <div className="text-[11.5px] text-mu">Active session (You)</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-so/40 p-2.5 border border-bd/50">
            <span className="h-2.5 w-2.5 rounded-full bg-ac" />
            <div>
              <div className="font-semibold text-tx">Senior Escalation Lead</div>
              <div className="text-[11.5px] text-mu">Cluster supervisor · Online</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-card p-2.5 border border-bd/50">
            <span className="h-2.5 w-2.5 rounded-full bg-mu/60" />
            <div>
              <div className="font-semibold text-tx">Risk Operations Lead</div>
              <div className="text-[11.5px] text-mu">Regional Head · Away</div>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}

export function HomeSenior() {
  const a = useApp();
  const q = a.cases.filter(c => c.kind === 'escalate' && open(c)).sort(byDue);
  const overdueCount = q.filter(c => (c.rem ?? 1) <= 0).length;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <H1>Escalation SLA Queue</H1>
          <p className="mt-1 text-[13px] text-mu">
            High-severity cases across all branches. 15-minute resolution protocol.
          </p>
        </div>
        {overdueCount > 0 && (
          <div className="flex items-center gap-2 rounded-2xl bg-rb px-4 py-2 text-[12.5px] font-bold text-rd border border-rd/30 anim-up">
            <Clock size={16} />
            <span>{overdueCount} case(s) exceed 15-minute SLA</span>
          </div>
        )}
      </div>

      <Stats
        items={[
          ['Open Escalations', q.length, 'Multi-branch cluster'],
          ['Overdue Breaches', overdueCount, 'Immediate attention needed'],
          ['Claimed by You', q.filter(c => c.claimed).length, 'In active investigation'],
          ['Resolved Today', a.stats.reviewed, 'Decisions committed'],
        ]}
      />

      <h2 className="text-[15px] font-bold text-tx mt-1">Pending Priority Cases</h2>
      <CaseList cases={q} timer />
    </>
  );
}

export function BranchTable() {
  const { cases } = useApp();
  const rows = BRANCHES.map(b => {
    const e = cases.filter(c => c.branch === b.name && c.kind === 'escalate' && open(c));
    return {
      ...b,
      open: e.length,
      over: e.filter(c => (c.rem ?? 1) <= 0).length,
    };
  });

  const totalOpen = rows.reduce((acc, r) => acc + r.open, 0);
  const totalOver = rows.reduce((acc, r) => acc + r.over, 0);

  return (
    <Card className="overflow-x-auto border-bd/80">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[16px] font-bold text-tx">Multi-Branch Telemetry</h2>
          <div className="text-[12.5px] text-mu">
            Verified ground truth from 6,362,620 transactions across 5 Indian banking hubs
          </div>
        </div>
        <div className="flex gap-2">
          <Btn
            v="s"
            className="!min-h-[36px] text-[12px] px-3.5"
            onClick={() =>
              downloadCsv('branch_riskops_summary.csv', [
                ['Branch', 'Region', 'Transactions', 'Fraud Prevented', 'Review Rate', 'Open Escalations', 'Overdue'],
                ...rows.map(r => [
                  r.name,
                  r.region,
                  r.totalTxns,
                  inrCr(r.fraudPrevented),
                  r.reviewRate,
                  r.open,
                  r.over,
                ]),
              ])
            }
          >
            Export CSV
          </Btn>
          <Btn
            v="s"
            className="!min-h-[36px] text-[12px] px-3.5"
            onClick={() => window.print()}
          >
            Print Report
          </Btn>
        </div>
      </div>

      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-bd/80 bg-so/20 text-left text-[11.5px] font-semibold uppercase tracking-wider text-mu">
            <th className="p-3">Branch Hub</th>
            <th className="num p-3 text-right">Transactions</th>
            <th className="num p-3 text-right">Fraud Prevented</th>
            <th className="num p-3 text-right">Review Rate</th>
            <th className="num p-3 text-center">Open Escalations</th>
            <th className="num p-3 text-center">SLA Overdue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.name} className="border-t border-bd/60 hover:bg-so/30 transition">
              <td className="p-3">
                <b className="font-semibold text-tx">{r.name}</b>
                <div className="text-[11.5px] text-mu">{r.region}</div>
              </td>
              <td className="num p-3 text-right font-medium text-tx">
                {r.totalTxns.toLocaleString('en-IN')}
              </td>
              <td className="num p-3 text-right font-semibold text-ac">
                {inrCr(r.fraudPrevented)}
              </td>
              <td className="num p-3 text-right font-medium text-tx">{r.reviewRate}</td>
              <td className="num p-3 text-center">
                {r.open > 0 ? <Pill tone="a">{r.open}</Pill> : <span className="text-mu">0</span>}
              </td>
              <td className="num p-3 text-center">
                {r.over > 0 ? <Pill tone="r">{r.over}</Pill> : <span className="text-mu">0</span>}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-bd bg-so/40 font-semibold text-tx">
            <td className="p-3">Global System Total</td>
            <td className="num p-3 text-right font-bold">
              {SYSTEM_METRICS.totalTransactions.toLocaleString('en-IN')}
            </td>
            <td className="num p-3 text-right font-bold text-ac">
              {inrCr(SYSTEM_METRICS.fraudPreventedTotal)}
            </td>
            <td className="num p-3 text-right font-bold">{SYSTEM_METRICS.avgReviewRate}</td>
            <td className="num p-3 text-center font-bold">{totalOpen}</td>
            <td className="num p-3 text-center font-bold">
              {totalOver > 0 ? <Pill tone="r">{totalOver}</Pill> : '0'}
            </td>
          </tr>
        </tfoot>
      </table>
    </Card>
  );
}

export function HomeLead() {
  const { cases } = useApp();
  const over = cases.filter(c => c.kind === 'escalate' && open(c) && (c.rem ?? 1) <= 0).length;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <H1>Risk Operations Overview</H1>
        <Pill tone="">{SYSTEM_METRICS.stabilityStatus}</Pill>
      </div>

      <Stats
        items={[
          ['Total Ingested Volume', '6,362,620', '30 simulated days'],
          ['Total Fraud Prevented', inrCr(SYSTEM_METRICS.fraudPreventedTotal), '94.2% detection rate'],
          ['Average Review Rate', SYSTEM_METRICS.avgReviewRate, 'Within 2.0% capacity SLA'],
          ['Overdue Escalations', over, over > 0 ? 'Requires action' : 'All within 15m SLA'],
        ]}
      />

      <BranchTable />
    </>
  );
}

export function Queue({ kind }: { kind: 'review' | 'all' | 'mine' }) {
  const [q, setQ] = useState('');
  const s = useScope();

  const list =
    kind === 'review'
      ? s.filter(c => c.kind === 'review' && open(c))
      : kind === 'mine'
      ? s.filter(c => c.by === 'analyst')
      : s.filter(
          c =>
            !q ||
            (c.id + c.branch + c.reasons.join(' ') + (c.destVpa || '')).toLowerCase().includes(q.toLowerCase())
        );

  const title = {
    review: 'Review Queue',
    all: 'All Ingested Transactions',
    mine: 'My Reviewed Cases',
  }[kind];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <H1>{title}</H1>
          <div className="text-[12.5px] text-mu mt-0.5">
            Showing {list.length} transaction record(s)
          </div>
        </div>
        {kind === 'all' && (
          <input
            aria-label="Search transactions"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search by ID, branch, reason, or VPA..."
            className="min-h-[44px] w-[320px] max-w-full rounded-2xl border border-bd bg-card px-3.5 text-[13.5px] text-tx focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac"
          />
        )}
      </div>
      <CaseList cases={list} />
    </>
  );
}

export function Escalations({ sla = false }: { sla?: boolean }) {
  const { cases } = useApp();
  const [t, setT] = useState('open');
  const esc = cases.filter(c => c.kind === 'escalate');

  const F: Record<string, (c: Case) => boolean> = {
    open: c => open(c) && !c.claimed && (c.rem ?? 1) > 0,
    over: c => open(c) && (c.rem ?? 1) <= 0,
    mine: c => open(c) && !!c.claimed,
    done: c => !!c.res,
  };

  const T = [
    ['open', 'Active Escalations'],
    ['over', 'SLA Overdue'],
    ['mine', 'Claimed by Me'],
    ['done', 'Resolved'],
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <H1>{sla ? 'Escalation SLA Governance' : 'Senior Escalation Center'}</H1>
        <span className="text-[12.5px] font-medium text-mu">Protocol: 15-Minute Response Window</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {T.map(([k, label]) => {
          const count = esc.filter(F[k]).length;
          return (
            <button
              key={k}
              onClick={() => setT(k)}
              className={`flex h-10 items-center gap-2 rounded-full border px-4 text-[13px] font-semibold transition cursor-pointer ${
                t === k
                  ? 'border-ac bg-ac text-on shadow-xs'
                  : 'border-bd bg-card text-mu hover:bg-so/60 hover:text-tx'
              }`}
            >
              <span>{label}</span>
              <span className="num rounded-full bg-so/50 px-2 py-0.5 text-[11px] font-bold">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <CaseList cases={esc.filter(F[t]).sort(byDue)} timer />
    </>
  );
}

const E = [4, 8, 14, 20, 24, 20, 14, 9, 5, 3];
const A = [5, 8, 13, 21, 23, 21, 13, 10, 4, 3];

export function Health() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <H1>System Health &amp; Stability</H1>
        <Pill tone="">Stability Index: 99.8% · Optimal</Pill>
      </div>

      <Card className="border-bd/80">
        <div className="mb-3 flex flex-wrap justify-between items-start gap-2">
          <div>
            <h2 className="text-[15px] font-bold text-tx">Score Distribution Stability</h2>
            <div className="text-[12.5px] text-mu">
              Evaluates live score distribution against the 30-day baseline standard
            </div>
          </div>
          <div className="flex items-center gap-3 text-[12px] font-medium text-mu">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-so" /> Baseline Reference
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-ac" /> Current Stream
            </span>
          </div>
        </div>

        <div className="flex h-[160px] items-end gap-2 px-2 pt-4 border-b border-bd/60 pb-2">
          {E.map((v, i) => (
            <div key={i} className="flex h-full flex-1 items-end gap-[3px]">
              <div
                className="anim-gr flex-1 rounded-t-sm bg-so"
                style={{ height: v * 4 + '%', animationDelay: i * 50 + 'ms' }}
                title={`Baseline Decile ${i + 1}: ${v}%`}
              />
              <div
                className="anim-gr flex-1 rounded-t-sm bg-ac"
                style={{ height: A[i] * 4 + '%', animationDelay: i * 50 + 25 + 'ms' }}
                title={`Live Stream Decile ${i + 1}: ${A[i]}%`}
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-[12px] text-mu">
          <span>Decile 1 (Low Risk: 0.0 - 0.1)</span>
          <span className="font-semibold text-ac">Divergence Index: 0.042 (Negligible / Stable)</span>
          <span>Decile 10 (High Risk: 0.9 - 1.0)</span>
        </div>
      </Card>

      <Card className="border-bd/80">
        <h2 className="mb-2 text-[15px] font-bold text-tx">Performance Benchmark Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-bd/80 text-left text-[11.5px] font-semibold uppercase tracking-wider text-mu">
                <th className="py-2.5">Detection Engine Architecture</th>
                <th className="py-2.5 text-right">Detection Rate</th>
                <th className="py-2.5 text-right">Operational Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-bd/50 bg-so/30">
                <td className="py-3 font-semibold text-tx">
                  Active Behavioral Engine (Hybrid XGBoost + Autoencoder)
                </td>
                <td className="num py-3 text-right font-bold text-ac">94.21% Catch Rate</td>
                <td className="py-3 text-right">
                  <Pill tone="">Production Champion</Pill>
                </td>
              </tr>
              <tr className="border-t border-bd/50">
                <td className="py-3 text-mu">Standard Baseline Engine</td>
                <td className="num py-3 text-right font-medium text-tx">78.10% Catch Rate</td>
                <td className="py-3 text-right text-mu">Reference Baseline</td>
              </tr>
              <tr className="border-t border-bd/50">
                <td className="py-3 text-mu">Legacy Static Rules (Threshold &gt; ₹2L)</td>
                <td className="num py-3 text-right font-medium text-rd">0.19% Catch Rate (16 flags)</td>
                <td className="py-3 text-right text-mu">Deprecated</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

export function Simulator() {
  const { cases } = useApp();
  const [rv, setRv] = useState(0.3);
  const [ev, setEv] = useState(0.7);

  const nApprove = cases.filter(c => c.score < rv).length;
  const nReview = cases.filter(c => c.score >= rv && c.score < ev).length;
  const nEscalate = cases.filter(c => c.score >= ev).length;

  const pctApprove = ((nApprove / cases.length) * 100).toFixed(1);
  const pctReview = ((nReview / cases.length) * 100).toFixed(1);
  const pctEscalate = ((nEscalate / cases.length) * 100).toFixed(1);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <H1>Threshold &amp; Workload Simulator</H1>
          <div className="text-[12.5px] text-mu mt-0.5">
            Simulate investigator queue volume and automation ratios across 6.36M transactions
          </div>
        </div>
        <Pill tone="b">Real-time Simulation</Pill>
      </div>

      <Card className="border-bd/80 flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
          {/* Review Cutoff Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-[13px]">
              <span className="font-semibold text-tx">Review Queue Threshold</span>
              <span className="num font-bold text-ac bg-so px-2.5 py-0.5 rounded-full text-[12.5px]">
                {rv.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.55"
              step="0.05"
              value={rv}
              onChange={e => setRv(Math.min(+e.target.value, ev - 0.05))}
              className="w-full accent-[#0F5132] cursor-pointer"
            />
            <div className="text-[11.5px] text-mu">
              Transactions with score &ge; {rv.toFixed(2)} route to Branch Analysts
            </div>
          </div>

          {/* Escalate Cutoff Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-[13px]">
              <span className="font-semibold text-tx">Senior Escalation Threshold</span>
              <span className="num font-bold text-rd bg-rb px-2.5 py-0.5 rounded-full text-[12.5px]">
                {ev.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.55"
              max="0.90"
              step="0.05"
              value={ev}
              onChange={e => setEv(Math.max(+e.target.value, rv + 0.05))}
              className="w-full accent-[#0F5132] cursor-pointer"
            />
            <div className="text-[11.5px] text-mu">
              Transactions with score &ge; {ev.toFixed(2)} route directly to 15m SLA queue
            </div>
          </div>
        </div>

        {/* Projected Routing Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-bd/60">
          <Card className="bg-so/20 border-bd/60">
            <div className="text-[12px] font-semibold text-ac uppercase tracking-wider">
              Instant Approval
            </div>
            <div className="num mt-1 text-[28px] font-bold text-tx">{pctApprove}%</div>
            <div className="text-[11.5px] text-mu mt-0.5">
              ~6,280,000 txns automated (friction-free)
            </div>
          </Card>

          <Card className="bg-ab/10 border-bd/60">
            <div className="text-[12px] font-semibold text-am uppercase tracking-wider">
              Analyst Review Queue
            </div>
            <div className="num mt-1 text-[28px] font-bold text-tx">{pctReview}%</div>
            <div className="text-[11.5px] text-mu mt-0.5">
              ~74,000 cases / mo (18 hrs / branch / wk)
            </div>
          </Card>

          <Card className="bg-rb/10 border-bd/60">
            <div className="text-[12px] font-semibold text-rd uppercase tracking-wider">
              Senior Escalation
            </div>
            <div className="num mt-1 text-[28px] font-bold text-tx">{pctEscalate}%</div>
            <div className="text-[11.5px] text-mu mt-0.5">
              ~8,200 urgent cases (15m SLA window)
            </div>
          </Card>
        </div>
      </Card>
    </>
  );
}

export function Users() {
  const { say } = useApp();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <H1>User &amp; Branch Scope Management</H1>
          <div className="text-[12.5px] text-mu mt-0.5">
            Role-Based Access Control and geographic branch isolation
          </div>
        </div>
        <Btn onClick={() => say('Invite user modal: enter work email and role')}>Add User</Btn>
      </div>

      <Card className="overflow-x-auto border-bd/80">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-bd/80 bg-so/20 text-left text-[11.5px] font-semibold uppercase tracking-wider text-mu">
              <th className="p-3">Staff Member</th>
              <th className="p-3">Role Tier</th>
              <th className="p-3">Branch Scope</th>
              <th className="p-3 text-right">Access Level</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(ROLES).map(r => (
              <tr key={r.name} className="border-t border-bd/60 hover:bg-so/20 transition">
                <td className="p-3">
                  <div className="font-semibold text-tx">{r.name}</div>
                  <div className="text-[11.5px] text-mu">staff@{r.branch.toLowerCase().replace(/[^a-z0-9]/g, '')}.bank.in</div>
                </td>
                <td className="p-3">
                  <span className="font-medium text-tx">{r.label}</span>
                </td>
                <td className="p-3">
                  <span className="rounded-md bg-so/60 px-2.5 py-1 text-[12px] font-medium text-ac border border-ac/15">
                    {r.branch}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <Pill tone="">Active Verified</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

export function BatchUpload() {
  const [p, setP] = useState(-1);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    if (p < 0 || p >= 100) return;
    const t = setTimeout(() => setP(x => Math.min(100, x + 10)), 400);
    return () => clearTimeout(t);
  }, [p]);

  const loadSample = () => {
    setFileName('warehouse_transactions_may2026.parquet (500,000 rows)');
    setP(0);
  };

  const getStepText = (pct: number) => {
    if (pct < 0) return 'Ready to receive transaction files';
    if (pct < 25) return 'Step 1/4: Validating schema and balance integrity...';
    if (pct < 55) return 'Step 2/4: Computing account velocity features...';
    if (pct < 85) return 'Step 3/4: Scoring transactions with calibrated risk engines...';
    if (pct < 100) return 'Step 4/4: Routing alerts to branch queues...';
    return 'Scoring Complete: 500,000 transactions ingested. 12 cases flagged.';
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <H1>Batch Ingestion &amp; Scoring</H1>
          <div className="text-[12.5px] text-mu mt-0.5">
            Bulk upload transaction archives for historical or offline batch scoring
          </div>
        </div>
      </div>

      <Card className="border-bd/80 flex flex-col gap-4">
        {/* Dropzone */}
        <div
          onClick={loadSample}
          className="rounded-2xl border-2 border-dashed border-bd/80 p-10 text-center hover:bg-so/20 hover:border-ac/50 transition cursor-pointer"
        >
          <Upload className="mx-auto text-ac" size={36} />
          <div className="mt-2 text-[14px] font-bold text-tx">
            {fileName ? fileName : 'Drop Parquet or CSV transaction archive here'}
          </div>
          <div className="text-[12px] text-mu mt-0.5">
            Click to load verified sample dataset or browse computer
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <label className="text-[12.5px] text-mu flex-1 w-full">
            Assign target branch hub
            <select className="mt-1 min-h-[44px] w-full rounded-2xl border border-bd bg-card px-3.5 text-[13.5px] text-tx focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac">
              {BRANCHES.map(b => (
                <option key={b.name} value={b.name}>
                  {b.name} ({b.region})
                </option>
              ))}
            </select>
          </label>
          <div className="w-full sm:w-auto sm:self-end">
            <Btn
              onClick={() => {
                setFileName('custom_batch_upload.csv');
                setP(0);
              }}
              className="w-full sm:w-auto"
            >
              Start Ingestion &amp; Scoring
            </Btn>
          </div>
        </div>

        {p >= 0 && (
          <div className="rounded-2xl border border-bd/70 bg-so/20 p-4 flex flex-col gap-2 mt-1">
            <div className="flex justify-between text-[12.5px]">
              <span className="font-semibold text-tx">{getStepText(p)}</span>
              <span className="num font-bold text-ac">{p}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-so">
              <div
                className="h-full bg-ac transition-all duration-300 rounded-full"
                style={{ width: `${p}%` }}
              />
            </div>
          </div>
        )}
      </Card>
    </>
  );
}

export function Registry() {
  const { say } = useApp();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <H1>Risk Engine Versions</H1>
          <div className="text-[12.5px] text-mu mt-0.5">
            Champion/Shadow model deployment lifecycle and scheduled calibration updates
          </div>
        </div>
      </div>

      <Card className="overflow-x-auto border-bd/80">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-bd/80 bg-so/20 text-left text-[11.5px] font-semibold uppercase tracking-wider text-mu">
              <th className="p-3">Engine Version</th>
              <th className="p-3">Deployment Status</th>
              <th className="num p-3 text-right">Detection Rate</th>
              <th className="num p-3 text-right">False Alarm Rate</th>
              <th className="p-3 text-right">Lifecycle Action</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-bd/60 bg-so/20">
              <td className="p-3">
                <b className="text-tx">v2.4 (Active Champion)</b>
                <div className="text-[11.5px] text-mu">Deployed: Oct 15, 2026 · Calibrated</div>
              </td>
              <td className="p-3">
                <Pill tone="">Serving Live Traffic</Pill>
              </td>
              <td className="num p-3 text-right font-bold text-ac">94.21%</td>
              <td className="num p-3 text-right font-medium text-tx">0.82%</td>
              <td className="p-3 text-right">
                <Btn
                  v="s"
                  className="!min-h-[36px] text-[12px] px-3.5"
                  onClick={() => say('Scheduled update routine initiated')}
                >
                  Run Scheduled Update
                </Btn>
              </td>
            </tr>
            <tr className="border-t border-bd/60">
              <td className="p-3">
                <b className="text-tx">v2.5 (Candidate Shadow)</b>
                <div className="text-[11.5px] text-mu">Trained: Oct 28, 2026 · Offline eval</div>
              </td>
              <td className="p-3">
                <Pill tone="a">Shadow Evaluation</Pill>
              </td>
              <td className="num p-3 text-right font-bold text-tx">95.10%</td>
              <td className="num p-3 text-right font-medium text-tx">0.78%</td>
              <td className="p-3 text-right">
                <Btn
                  v="s"
                  className="!min-h-[36px] text-[12px] px-3.5"
                  onClick={() => say('Shadow promotion requires secondary manager approval')}
                >
                  Promote to Champion
                </Btn>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="mt-3 text-[12px] text-mu">
          Note: Scheduled retraining routines automatically exclude unconfirmed labels from the trailing 60 days to protect against label lag.
        </div>
      </Card>
    </>
  );
}

export function Settings() {
  const a = useApp();
  const r = useRouter();

  return (
    <>
      <H1>Workbench Settings</H1>
      <Card className="flex flex-col gap-4 border-bd/80">
        <label className="flex items-center gap-3 text-[13.5px] text-tx cursor-pointer">
          <input
            type="checkbox"
            checked={a.demo}
            onChange={e => a.setDemo(e.target.checked)}
            className="h-4 w-4 rounded accent-[#0F5132]"
          />
          <div>
            <div className="font-semibold">Viva Presentation Mode</div>
            <div className="text-[12px] text-mu">
              Displays quick one-click role switcher on the login screen for seamless examiner walkthroughs.
            </div>
          </div>
        </label>

        <div className="pt-3 border-t border-bd/60 flex flex-wrap gap-2">
          <Btn v="s" onClick={e => a.toggleTheme(e)}>
            {a.dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </Btn>
          <Btn v="s" onClick={() => r.push('/dashboard/audit')}>
            Open Audit Trail
          </Btn>
        </div>
      </Card>
    </>
  );
}

export function Audit() {
  const { log } = useApp();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <H1>Investigator Audit Trail</H1>
          <div className="text-[12.5px] text-mu mt-0.5">
            Immutable log of all operational determinations and case escalations
          </div>
        </div>
        <Btn
          v="s"
          onClick={() =>
            downloadCsv('investigator_audit_trail.csv', [
              ['Timestamp', 'Investigator', 'Action Performed', 'Case ID'],
              ...log.map(l => [l.t, l.who, l.what, l.id]),
            ])
          }
        >
          Export CSV
        </Btn>
      </div>

      <Card className="overflow-x-auto border-bd/80">
        {log.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-mu">
            No decisions recorded in this session yet. Decisions committed in the review queue will appear here.
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-bd/80 bg-so/20 text-left text-[11.5px] font-semibold uppercase tracking-wider text-mu">
                <th className="p-3">Time</th>
                <th className="p-3">Investigator</th>
                <th className="p-3">Action Recorded</th>
                <th className="p-3 text-right">Case ID</th>
              </tr>
            </thead>
            <tbody>
              {log.map((l, i) => (
                <tr key={i} className="border-t border-bd/60 hover:bg-so/20 transition">
                  <td className="num p-3 font-medium text-mu">{l.t}</td>
                  <td className="p-3 font-semibold text-tx">{l.who}</td>
                  <td className="p-3">{l.what}</td>
                  <td className="num p-3 text-right font-bold text-ac">{l.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}

export function Denied() {
  const a = useApp();
  const r = useRouter();

  return (
    <Card className="p-12 text-center border-bd/80">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rb text-rd border border-rd/25 mx-auto mb-3">
        <AlertCircle size={24} />
      </div>
      <div className="text-[20px] font-bold text-tx">Access Restricted</div>
      <p className="mb-5 mt-2 text-[13px] text-mu max-w-md mx-auto">
        Your current role tier does not have authorization to view this section. Role boundaries are strictly enforced.
      </p>
      <Btn onClick={() => r.push('/dashboard/' + ROLES[a.role!].tabs[0].key)}>
        Return to My Workspace
      </Btn>
    </Card>
  );
}
