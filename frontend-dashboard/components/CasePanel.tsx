'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '@/lib/store';
import { inr } from '@/lib/export';
import { Btn, Card } from './ui';

const L = ({ children }: { children: string }) => <div className="mb-1.5 text-[12.5px] font-semibold text-mu">{children}</div>;

export default function CasePanel() {
  const a = useApp(); const [draft, setDraft] = useState(''); const [modal, setModal] = useState(false); const [choice, setChoice] = useState<'fraud' | 'fp'>('fraud');
  const c = a.cases.find(x => x.id === a.selected);
  if (!c || !a.role) return null;
  const canA = a.role === 'analyst' && c.kind === 'review' && !c.res;
  const canS = a.role === 'senior' && c.kind === 'escalate' && !c.res;
  const xg = Math.min(.99, c.score * 1.05), ae = Math.min(1, Math.max(0, (c.score - .6 * xg) / .4));
  return (
    <>
      <Card className="anim-sl flex w-[380px] max-w-full flex-none flex-col gap-3.5">
        <div className="flex items-start justify-between">
          <div><b className="num text-[22px]">{inr(c.amount)}</b><div className="text-[12.5px] text-mu">{c.id} · {c.branch}</div></div>
          <button aria-label="Close panel" onClick={() => a.select(null)} className="flex h-11 w-11 items-center justify-center rounded-full border border-bd"><X size={18} /></button>
        </div>
        <div><L>WHY IT WAS FLAGGED</L>{c.reasons.map(r => <div key={r} className="border-t border-bd py-2 text-[13.5px]">{r}</div>)}</div>
        <div><L>MONEY TRAIL</L><div className="flex flex-wrap items-center gap-1.5">{c.chain.map((n, i) =>
          <span key={n} className="flex items-center gap-1.5"><span className="rounded-full bg-so px-3 py-2 text-[11.5px] font-semibold text-ac">{n}</span>{i < c.chain.length - 1 && <span className="text-mu">→</span>}</span>)}</div></div>
        <div><L>NOTES</L>{(a.notes[c.id] || []).map((n, i) => <div key={i} className="mb-1.5 rounded-xl bg-so px-3 py-2.5 text-[13px]">{n}</div>)}
          <textarea aria-label="Add note" rows={2} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Why this matters, what to check next" className="w-full rounded-2xl border border-bd bg-card p-3 text-[14px] text-tx" />
          <Btn v="s" className="mt-1.5 !min-h-[36px]" onClick={() => { if (draft.trim()) { a.addNote(c.id, draft.trim()); setDraft(''); } }}>Add note</Btn></div>
        <div className="flex flex-wrap gap-2">
          {canA && <><Btn v="s" onClick={() => a.decide(c.id, 'fp')}>False positive</Btn><Btn v="d" onClick={() => a.decide(c.id, 'fraud')}>Confirm fraud</Btn><Btn onClick={() => a.escalate(c.id)}>Escalate to Senior</Btn></>}
          {canS && <><Btn v="s" onClick={() => a.claim(c.id)}>{c.claimed ? 'Claimed by you' : 'Claim'}</Btn><Btn onClick={() => setModal(true)}>Resolve</Btn></>}
          {!canA && !canS && <p className="text-[12.5px] text-mu">View only for your role.</p>}
        </div>
        <div><L>RISK INDICATORS</L><div className="num text-[12.5px] leading-7 text-mu">Overall Risk Level {(c.score * 100).toFixed(0)}%<br />Pattern Similarity {(xg * 100).toFixed(0)}%<br />Account Anomaly Index {(ae * 100).toFixed(0)}%</div></div>
      </Card>
      {modal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><Card className="anim-up flex w-[380px] flex-col gap-3">
        <h2 className="text-[16px] font-semibold">Resolve {c.id}</h2>
        {(['fraud', 'fp'] as const).map(k => <button key={k} onClick={() => setChoice(k)} className={`h-11 rounded-full border px-4 text-[13px] font-semibold ${choice === k ? 'border-ac bg-ac text-on' : 'border-bd text-mu'}`}>{k === 'fraud' ? 'Confirmed fraud' : 'False positive'}</button>)}
        <div className="flex justify-end gap-2"><Btn v="s" onClick={() => setModal(false)}>Cancel</Btn><Btn onClick={() => { a.decide(c.id, choice); setModal(false); }}>Confirm</Btn></div>
      </Card></div>}
    </>
  );
}
