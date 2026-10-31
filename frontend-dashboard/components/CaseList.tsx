'use client';
import { Case, useApp } from '@/lib/store';
import { inr, mmss } from '@/lib/export';
import { Pill } from './ui';

export function right(c: Case, timer: boolean): [string, '' | 'r'] {
  if (c.res) return ['Resolved', ''];
  if (timer && c.rem !== null) return c.rem <= 0 ? ['Overdue +' + mmss(c.rem), 'r'] : [mmss(c.rem), c.rem <= 300 ? 'r' : ''];
  return [c.kind === 'escalate' ? 'Escalated' : 'Review', ''];
}
export default function CaseList({ cases, timer = false }: { cases: Case[]; timer?: boolean }) {
  const { selected, select } = useApp();
  return (
    <div className="overflow-hidden rounded-[22px] border border-bd bg-card">
      {cases.length === 0 && <div className="p-7 text-center text-[13px] text-mu">Nothing here. You are all caught up.</div>}
      {cases.map(c => { const [t, tone] = right(c, timer);
        return (
          <button key={c.id} onClick={() => select(c.id)} className={`flex min-h-[60px] w-full items-center gap-3.5 border-t border-bd px-4 py-2.5 text-left text-[13.5px] transition first:border-t-0 hover:bg-so ${selected === c.id ? 'bg-so' : ''}`}>
            <span className="w-[130px] flex-none"><b className="num">{inr(c.amount)}</b><span className="block text-[12.5px] text-mu">{c.id}</span></span>
            <span className="w-[130px] flex-none text-[12.5px] text-mu">{c.branch}</span>
            <Pill tone={c.score >= .7 ? 'r' : c.score >= .3 ? 'a' : ''}>{c.score.toFixed(2)}</Pill>
            <span className="min-w-[120px] flex-1">{c.reasons[0]}</span>
            <Pill tone={tone}>{t}</Pill>
          </button>); })}
    </div>
  );
}
