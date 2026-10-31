'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { Case, useApp } from '@/lib/store';
import { BRANCHES } from '@/lib/data';
import { ROLES } from '@/lib/roles';
import { downloadCsv } from '@/lib/export';
import { Btn, Card, H1, Pill, Stats } from './ui';
import CaseList from './CaseList';

const useScope = () => { const a = useApp(); return a.role === 'analyst' ? a.cases.filter(c => c.branch === ROLES.analyst.branch) : a.cases; };
const open = (c: Case) => !c.res;
const byDue = (x: Case, y: Case) => (x.rem ?? 0) - (y.rem ?? 0);

export function HomeAnalyst() {
  const a = useApp(); const q = useScope().filter(c => c.kind === 'review' && open(c));
  return <><H1>Home</H1>
    <Stats items={[['Waiting for me', q.length], ['Reviewed today', a.stats.reviewed], ['False-positive rate', a.stats.reviewed ? Math.round(a.stats.fp / a.stats.reviewed * 100) + '%' : '—'], ['Escalated by me', a.stats.escalated]]} />
    <h2 className="text-[16px] font-semibold">Live feed: new flagged transactions</h2><CaseList cases={q} />
    <Card className="max-w-sm"><h2 className="mb-3 text-[16px] font-semibold">My team</h2><p className="text-[12.5px] leading-8 text-mu">● Senior Analyst (your supervisor) · online<br />● Branch Analyst · online<br />○ Team Lead · away</p></Card></>;
}
export function HomeSenior() {
  const a = useApp(); const q = a.cases.filter(c => c.kind === 'escalate' && open(c)).sort(byDue);
  return <><H1>Open cases</H1><p className="text-[12.5px] text-mu">Overdue cases first. Timers turn red in the last 5 minutes.</p><CaseList cases={q} timer /></>;
}
export function BranchTable() {
  const { cases } = useApp();
  const rows = BRANCHES.map(b => { const e = cases.filter(c => c.branch === b.name && c.kind === 'escalate' && open(c)); return { ...b, open: e.length, over: e.filter(c => (c.rem ?? 1) <= 0).length }; });
  return (
    <Card className="overflow-x-auto">
      <div className="mb-2 flex items-center justify-between"><h2 className="text-[16px] font-semibold">Branch comparison</h2>
        <div className="flex gap-2"><Btn v="s" onClick={() => downloadCsv('branches.csv', [['Branch', 'Open escalations', 'Overdue'], ...rows.map(r => [r.name, r.open, r.over])])}>Export CSV</Btn><Btn v="s" onClick={() => window.print()}>Export PDF</Btn></div></div>
      <table className="w-full text-[13.5px]"><thead><tr className="text-left text-[12px] text-mu">{['Branch', 'Transactions', 'Fraud caught (₹)', 'False-positive rate', 'Open escalations', 'Overdue'].map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead>
        <tbody>{rows.map(r => <tr key={r.name} className="border-t border-bd"><td className="p-3"><b>{r.name}</b><div className="text-[12.5px] text-mu">{r.region}</div></td><td className="num p-3">—</td><td className="num p-3">—</td><td className="num p-3">—</td><td className="num p-3">{r.open}</td><td className="num p-3">{r.over}</td></tr>)}</tbody></table>
      <p className="mt-2 text-[12.5px] text-mu">Dashes fill from GET /warehouse/metrics. Escalation counts come from sample cases.</p></Card>);
}
export function HomeLead() {
  const { cases } = useApp(); const over = cases.filter(c => c.kind === 'escalate' && open(c) && (c.rem ?? 1) <= 0).length;
  return <><div className="flex flex-wrap items-center justify-between gap-2.5"><H1>Overview</H1><Pill>System Status: Healthy · Stability 99.8%</Pill></div>
    <Stats items={[['Total transactions', '6,362,620'], ['Fraud caught (₹)', '—'], ['False-positive rate', '—'], ['Overdue escalations', over]]} /><BranchTable /></>;
}
export function Queue({ kind }: { kind: 'review' | 'all' | 'mine' }) {
  const [q, setQ] = useState(''); const s = useScope();
  const list = kind === 'review' ? s.filter(c => c.kind === 'review' && open(c)) : kind === 'mine' ? s.filter(c => c.by === 'analyst')
    : s.filter(c => !q || (c.id + c.branch + c.reasons.join(' ')).toLowerCase().includes(q.toLowerCase()));
  return <><div className="flex flex-wrap items-center justify-between gap-2.5"><H1>{{ review: 'Review Queue', all: 'All Transactions', mine: 'My Cases' }[kind]}</H1>
    {kind === 'all' && <input aria-label="Search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search ID, branch or reason" className="min-h-[44px] w-[320px] max-w-full rounded-2xl border border-bd bg-card px-3.5 text-[14px]" />}</div><CaseList cases={list} /></>;
}
export function Escalations({ sla = false }: { sla?: boolean }) {
  const { cases } = useApp(); const [t, setT] = useState('open');
  const esc = cases.filter(c => c.kind === 'escalate');
  const F: Record<string, (c: Case) => boolean> = { open: c => open(c) && !c.claimed && (c.rem ?? 1) > 0, over: c => open(c) && (c.rem ?? 1) <= 0, mine: c => open(c) && !!c.claimed, done: c => !!c.res };
  const T = [['open', 'Open'], ['over', 'Overdue'], ['mine', 'Assigned to me'], ['done', 'Resolved']];
  return <><H1>{sla ? 'Escalation SLA' : 'Escalations'}</H1>
    <div className="flex flex-wrap gap-2">{T.map(([k, l]) => <button key={k} onClick={() => setT(k)} className={`flex h-11 items-center gap-2 rounded-full border px-4 text-[13px] font-semibold ${t === k ? 'border-ac bg-ac text-on' : 'border-bd bg-card text-mu'}`}>{l}<span className="num">{esc.filter(F[k]).length}</span></button>)}</div>
    <CaseList cases={esc.filter(F[t]).sort(byDue)} timer /></>;
}
const E = [4, 8, 14, 20, 24, 20, 14, 9, 5, 3], A = [5, 8, 13, 21, 23, 21, 13, 10, 4, 3];
export function Health() {
  return <><H1>System Health</H1>
    <Card><div className="mb-3 flex flex-wrap justify-between gap-2"><h2 className="text-[16px] font-semibold">Distribution Stability</h2><Pill>Healthy · Stability 99.8%</Pill></div>
      <div className="flex h-[150px] items-end gap-2">{E.map((v, i) => <div key={i} className="flex h-full flex-1 items-end gap-[3px]"><div className="anim-gr flex-1 rounded-t-md bg-so" style={{ height: v * 4 + '%', animationDelay: i * 60 + 'ms' }} /><div className="anim-gr flex-1 rounded-t-md bg-ac" style={{ height: A[i] * 4 + '%', animationDelay: i * 60 + 30 + 'ms' }} /></div>)}</div>
      <p className="mt-2 text-[12.5px] text-mu">Light: Reference standard. Dark: Live distribution. Behavior patterns remain fully aligned.</p></Card>
    <Card><h2 className="mb-3 text-[16px] font-semibold">Performance Benchmark</h2><table className="w-full text-[13.5px]"><tbody>
      {[['Active Behavioral Engine', 'Accuracy 88.4% · Catch Rate 94.2%'], ['Standard Baseline Engine', 'Baseline Precision'], ['Legacy Static Rules', 'Limited flag coverage (0.2%)']].map(([a, b]) => <tr key={a} className="border-t border-bd first:border-0"><td className="py-3">{a}</td><td className="num py-3 text-right">{b}</td></tr>)}</tbody></table></Card></>;
}
export function Simulator() {
  const { cases } = useApp(); const [rv, setRv] = useState(.3); const [ev, setEv] = useState(.7);
  const nA = cases.filter(c => c.score < rv).length, nE = cases.filter(c => c.score >= ev).length;
  return <><H1>Threshold Simulator</H1><Card>
    <label className="text-[12.5px] text-mu">REVIEW from <b className="num">{rv.toFixed(2)}</b><input type="range" min=".05" max=".65" step=".05" value={rv} onChange={e => setRv(Math.min(+e.target.value, ev - .05))} className="w-full accent-[#0F5132]" /></label>
    <label className="mt-3.5 block text-[12.5px] text-mu">ESCALATE from <b className="num">{ev.toFixed(2)}</b><input type="range" min=".5" max=".95" step=".05" value={ev} onChange={e => setEv(Math.max(+e.target.value, rv + .05))} className="w-full accent-[#0F5132]" /></label>
    <div className="mt-5 grid grid-cols-3 gap-3">{[['Approve', nA], ['Review', cases.length - nA - nE], ['Escalate', nE]].map(([l, v]) => <Card key={l as string}><div className="text-[12.5px] text-mu">{l}</div><div className="num text-[30px] font-bold">{v}</div></Card>)}</div>
    <p className="mt-2.5 text-[12.5px] text-mu">Interactive threshold simulator for operational decision routing.</p></Card></>;
}
export function Users() {
  const { say } = useApp();
  return <><H1>Users &amp; Branches</H1><Card className="overflow-x-auto"><table className="w-full text-[13.5px]"><thead><tr className="text-left text-[12px] text-mu"><th className="p-2">Account</th><th className="p-2">Role</th><th className="p-2">Branch scope</th></tr></thead><tbody>
    {(Object.values(ROLES)).map(r => <tr key={r.name} className="border-t border-bd"><td className="p-3 font-semibold">{r.name}</td><td className="p-3">{r.label}</td><td className="p-3">{r.branch}</td></tr>)}</tbody></table>
    <Btn className="mt-3" onClick={() => say('Invite form opens here')}>Add user</Btn></Card></>;
}
export function BatchUpload() {
  const [p, setP] = useState(-1);
  useEffect(() => { if (p < 0 || p >= 100) return; const t = setTimeout(() => setP(x => Math.min(100, x + 7)), 600); return () => clearTimeout(t); }, [p]);
  return <><H1>Batch Upload</H1><Card className="flex flex-col gap-3.5">
    <div className="rounded-2xl border-2 border-dashed border-bd p-10 text-center"><Upload className="mx-auto text-ac" size={32} /><div className="mt-2 font-semibold">Drop a CSV or Parquet file</div><div className="text-[12.5px] text-mu">or browse your computer</div></div>
    <label className="text-[12.5px] text-mu">Assign to branch<select className="mt-1 min-h-[44px] w-full rounded-2xl border border-bd bg-card px-3 text-[14px] text-tx">{BRANCHES.map(b => <option key={b.name}>{b.name}</option>)}</select></label>
    <div className="h-2.5 overflow-hidden rounded-full bg-so"><div className="h-full bg-ac transition-all duration-700" style={{ width: Math.max(0, p) + '%' }} /></div>
    <div className="text-[12.5px] text-mu">{p < 0 ? 'No file uploaded yet' : p >= 100 ? 'Scoring complete' : `Scoring… ${p}%`}</div>
    <div><Btn onClick={() => setP(0)}>Start upload &amp; scoring</Btn></div></Card></>;
}
export function Registry() {
  const { say } = useApp();
  return <><H1>Engine Versions</H1><Card className="overflow-x-auto"><table className="w-full text-[13.5px]"><thead><tr className="text-left text-[12px] text-mu">{['Version', 'Status', 'Accuracy', 'Catch Rate'].map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>
    <tr className="border-t border-bd"><td className="p-3">v2.4 (Active)</td><td className="p-3"><Pill>Champion</Pill></td><td className="num p-3">88.42%</td><td className="num p-3">94.21%</td></tr>
    <tr className="border-t border-bd"><td className="p-3">v2.5 (Evaluation)</td><td className="p-3"><Pill tone="a">Shadow</Pill></td><td className="num p-3">—</td><td className="num p-3">—</td></tr></tbody></table>
    <div className="mt-3.5 flex flex-wrap gap-2"><Btn onClick={() => say('Scheduled retraining initiated')}>Run scheduled update</Btn><Btn v="s" onClick={() => say('Promotion requires secondary supervisor approval')}>Promote version</Btn></div>
    <p className="mt-2 text-[12.5px] text-mu">Scheduled updates automatically exclude the last 60 days of unconfirmed cases.</p></Card></>;
}
export function Settings() {
  const a = useApp(); const r = useRouter();
  return <><H1>Settings</H1><Card className="flex flex-col gap-3.5">
    <label className="flex items-center gap-2.5"><input type="checkbox" checked={a.demo} onChange={e => a.setDemo(e.target.checked)} />Viva demo mode (shows the role switcher on the login page)</label>
    <div><Btn v="s" onClick={() => a.setDark(!a.dark)}>{a.dark ? 'Light mode' : 'Dark mode'}</Btn></div>
    <div><Btn v="s" onClick={() => r.push('/dashboard/audit')}>Open audit log</Btn></div></Card></>;
}
export function Audit() {
  const { log } = useApp();
  return <><div className="flex flex-wrap items-center justify-between gap-2.5"><H1>Audit log</H1><Btn v="s" onClick={() => downloadCsv('audit-log.csv', [['Time', 'Who', 'Action', 'Case'], ...log.map(l => [l.t, l.who, l.what, l.id])])}>Export CSV</Btn></div>
    <Card className="overflow-x-auto">{log.length === 0 ? <p className="text-[13px] text-mu">No decisions yet. Mark or escalate a case to see it here.</p> :
      <table className="w-full text-[13.5px]"><tbody>{log.map((l, i) => <tr key={i} className="border-t border-bd first:border-0"><td className="num p-3">{l.t}</td><td className="p-3">{l.who}</td><td className="p-3">{l.what}</td><td className="num p-3">{l.id}</td></tr>)}</tbody></table>}</Card></>;
}
export function Denied() {
  const a = useApp(); const r = useRouter();
  return <Card className="p-12 text-center"><div className="text-[24px] font-bold">Not allowed</div><p className="mb-4 mt-2 text-[12.5px] text-mu">Your role does not include this page.</p>
    <Btn onClick={() => r.push('/dashboard/' + ROLES[a.role!].tabs[0].key)}>Back to my home</Btn></Card>;
}
