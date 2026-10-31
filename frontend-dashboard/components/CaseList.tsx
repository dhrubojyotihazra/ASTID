'use client';
import { CheckCircle2, Clock } from 'lucide-react';
import { Case, useApp } from '@/lib/store';
import { inr, mmss } from '@/lib/export';
import { Pill } from './ui';

export function right(c: Case, timer: boolean): [string, '' | 'r' | 'a'] {
  if (c.res) return [c.res === 'fraud' ? 'Confirmed Fraud' : 'False Positive', ''];
  if (timer && c.rem !== null) {
    if (c.rem <= 0) return ['Overdue +' + mmss(c.rem), 'r'];
    if (c.rem <= 300) return [mmss(c.rem) + ' left', 'r'];
    return [mmss(c.rem) + ' left', 'a'];
  }
  return [c.kind === 'escalate' ? 'Escalated' : 'Needs Review', c.kind === 'escalate' ? 'r' : 'a'];
}

export default function CaseList({
  cases,
  timer = false,
}: {
  cases: Case[];
  timer?: boolean;
}) {
  const { selected, select } = useApp();

  return (
    <div className="overflow-hidden rounded-[22px] border border-bd bg-card shadow-xs">
      {/* Table Column Header for Quick Operational Scanning */}
      <div className="hidden sm:flex items-center gap-3.5 border-b border-bd/80 bg-so/30 px-4 py-2.5 text-[11.5px] font-semibold text-mu uppercase tracking-wider">
        <span className="w-[140px] flex-none">Amount · ID</span>
        <span className="w-[130px] flex-none">Branch Hub</span>
        <span className="w-[85px] flex-none text-center">Risk Index</span>
        <span className="min-w-[140px] flex-1">Primary Flag Reason</span>
        <span className="w-[120px] flex-none text-right">Status / SLA</span>
      </div>

      {cases.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-so text-ac border border-ac/20 mb-3">
            <CheckCircle2 size={24} />
          </div>
          <div className="text-[15px] font-semibold text-tx">Queue is Clear</div>
          <p className="mt-1 text-[12.5px] text-mu max-w-sm">
            All flagged transactions have been reviewed and processed. New incoming alerts will appear here in real time.
          </p>
        </div>
      ) : (
        cases.map(c => {
          const [statusText, statusTone] = right(c, timer);
          const isSelected = selected === c.id;

          return (
            <button
              key={c.id}
              onClick={() => select(c.id)}
              aria-label={`Inspect case ${c.id} for amount ${inr(c.amount)}`}
              className={`flex min-h-[58px] w-full items-center gap-3.5 border-t border-bd/70 px-4 py-3 text-left text-[13px] transition first:border-t-0 hover:bg-so/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ac cursor-pointer ${
                isSelected ? 'bg-so border-l-4 border-l-ac' : ''
              }`}
            >
              {/* Amount & ID */}
              <span className="w-[140px] flex-none">
                <b className="num text-[14px] text-tx block">{inr(c.amount)}</b>
                <span className="num block text-[11.5px] font-medium text-mu">{c.id}</span>
              </span>

              {/* Branch */}
              <span className="w-[130px] flex-none text-[12.5px] text-mu truncate font-medium">
                {c.branch}
              </span>

              {/* Score Meter */}
              <span className="w-[85px] flex-none text-center">
                <Pill tone={c.score >= 0.7 ? 'r' : c.score >= 0.4 ? 'a' : ''}>
                  {(c.score * 100).toFixed(0)}%
                </Pill>
              </span>

              {/* Reason */}
              <span className="min-w-[140px] flex-1 text-tx truncate font-normal">
                {c.reasons[0]}
              </span>

              {/* Status / Timer */}
              <span className="w-[120px] flex-none text-right flex items-center justify-end gap-1.5">
                {timer && c.rem !== null && !c.res && (
                  <Clock size={12} className={c.rem <= 300 ? 'text-rd' : 'text-mu'} />
                )}
                <Pill tone={statusTone}>{statusText}</Pill>
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}
