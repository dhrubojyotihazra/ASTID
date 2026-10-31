'use client';
import { useState, useEffect } from 'react';
import { X, ArrowRight, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useApp } from '@/lib/store';
import { inr } from '@/lib/export';
import { Btn, Card, Pill } from './ui';

const SectionHeader = ({ children }: { children: string }) => (
  <div className="mb-2 text-[11.5px] font-bold uppercase tracking-wider text-mu">{children}</div>
);

export default function CasePanel() {
  const a = useApp();
  const [draft, setDraft] = useState('');
  const [modal, setModal] = useState(false);
  const [choice, setChoice] = useState<'fraud' | 'fp'>('fraud');

  const c = a.cases.find(x => x.id === a.selected);

  // Keyboard accessibility: Close drawer on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (modal) setModal(false);
        else a.select(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modal, a]);

  if (!c || !a.role) return null;

  const canAnalyst = a.role === 'analyst' && c.kind === 'review' && !c.res;
  const canSenior = a.role === 'senior' && c.kind === 'escalate' && !c.res;

  // Normalized risk indicators (non-academic, operational metrics)
  const patternMatch = Math.min(0.99, c.score * 1.05);
  const anomalyIndex = Math.min(1, Math.max(0, (c.score - 0.6 * patternMatch) / 0.4));
  const isHighValue = c.amount >= 100000;

  const panelInner = (
    <div className="flex flex-col gap-4">
      {/* Panel Header */}
      <div className="flex items-start justify-between border-b border-bd/70 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <b className="num text-[24px] font-bold text-tx">{inr(c.amount)}</b>
            {isHighValue && (
              <Pill tone="r" className="text-[10.5px]">
                High Value
              </Pill>
            )}
          </div>
          <div className="text-[12.5px] font-medium text-mu mt-0.5">
            Case <span className="num font-semibold text-tx">{c.id}</span> · {c.branch}
          </div>
        </div>
        <button
          aria-label="Close case drawer"
          onClick={() => a.select(null)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-bd text-mu hover:text-tx hover:border-ac/50 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Why it was flagged */}
      <div>
        <SectionHeader>Trigger Indicators</SectionHeader>
        <div className="flex flex-col gap-2">
          {c.reasons.map((r, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 rounded-2xl border border-bd/60 bg-so/20 p-2.5 text-[13px] text-tx leading-snug"
            >
              <AlertTriangle size={15} className="text-am flex-none mt-0.5" />
              <span>{r}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Assessment Progress Meters */}
      <div className="rounded-[22px] border border-bd/70 bg-card p-3.5 shadow-xs">
        <SectionHeader>Risk Assessment</SectionHeader>
        <div className="flex flex-col gap-3">
          {/* Overall Score */}
          <div>
            <div className="flex justify-between text-[12.5px] mb-1">
              <span className="font-semibold text-tx">Overall Risk Level</span>
              <span className="num font-bold text-tx">{(c.score * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-so overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  c.score >= 0.7 ? 'bg-rd' : c.score >= 0.4 ? 'bg-am' : 'bg-ac'
                }`}
                style={{ width: `${Math.round(c.score * 100)}%` }}
              />
            </div>
          </div>

          {/* Pattern Match */}
          <div>
            <div className="flex justify-between text-[12px] mb-1 text-mu">
              <span>Transaction Pattern Match</span>
              <span className="num font-medium text-tx">{(patternMatch * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-so overflow-hidden">
              <div
                className="h-full bg-ac/80 rounded-full transition-all duration-500"
                style={{ width: `${Math.round(patternMatch * 100)}%` }}
              />
            </div>
          </div>

          {/* Behavioral Deviation */}
          <div>
            <div className="flex justify-between text-[12px] mb-1 text-mu">
              <span>Account Behavior Deviation</span>
              <span className="num font-medium text-tx">{(anomalyIndex * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-so overflow-hidden">
              <div
                className="h-full bg-am/80 rounded-full transition-all duration-500"
                style={{ width: `${Math.round(anomalyIndex * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Money Trail */}
      <div>
        <SectionHeader>Money Trail Chain</SectionHeader>
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-bd/60 bg-so/20 p-3">
          {c.chain.map((node, i) => (
            <span key={node} className="flex items-center gap-1.5">
              <span className="rounded-xl border border-ac/25 bg-so px-2.5 py-1 text-[12px] font-semibold text-ac num">
                {node}
              </span>
              {i < c.chain.length - 1 && (
                <ArrowRight size={13} className="text-mu/70 flex-none" />
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Operational Actions */}
      <div className="border-t border-bd/70 pt-3 flex flex-col gap-2">
        <SectionHeader>Operational Decision</SectionHeader>
        {canAnalyst && (
          <div className="grid grid-cols-2 gap-2">
            <Btn
              v="s"
              onClick={() => a.decide(c.id, 'fp')}
              className="text-[12.5px] !min-h-[40px]"
            >
              False Positive
            </Btn>
            <Btn
              v="d"
              onClick={() => a.decide(c.id, 'fraud')}
              className="text-[12.5px] !min-h-[40px]"
            >
              Confirm Fraud
            </Btn>
            <Btn
              onClick={() => a.escalate(c.id)}
              className="col-span-2 text-[12.5px] !min-h-[40px]"
            >
              Escalate to Senior Analyst
            </Btn>
          </div>
        )}

        {canSenior && (
          <div className="grid grid-cols-2 gap-2">
            <Btn
              v="s"
              onClick={() => a.claim(c.id)}
              className="text-[12.5px] !min-h-[40px]"
            >
              {c.claimed ? 'Claimed' : 'Claim Case'}
            </Btn>
            <Btn
              onClick={() => setModal(true)}
              className="text-[12.5px] !min-h-[40px]"
            >
              Resolve Case
            </Btn>
          </div>
        )}

        {!canAnalyst && !canSenior && (
          <div className="rounded-xl bg-so/40 p-2.5 text-center text-[12.5px] text-mu">
            {c.res ? (
              <span className="font-semibold text-ac">
                Case resolved as {c.res === 'fraud' ? 'Fraud' : 'False Positive'}
              </span>
            ) : (
              <span>Inspection mode · Action requires assigned role</span>
            )}
          </div>
        )}
      </div>

      {/* Notes & Audit History */}
      <div className="border-t border-bd/70 pt-3">
        <SectionHeader>Investigation Notes</SectionHeader>
        <div className="flex flex-col gap-2 mb-2 max-h-36 overflow-y-auto">
          {(a.notes[c.id] || []).length === 0 ? (
            <div className="text-[12px] text-mu italic py-1">No notes recorded yet.</div>
          ) : (
            (a.notes[c.id] || []).map((n, i) => (
              <div key={i} className="rounded-xl border border-bd/60 bg-so/30 px-3 py-2 text-[12.5px] text-tx">
                {n}
              </div>
            ))
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <textarea
            aria-label="Add case note"
            rows={2}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Add investigator note or next steps..."
            className="w-full rounded-2xl border border-bd bg-card p-3 text-[13px] text-tx focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac"
          />
          <div className="flex justify-end">
            <Btn
              v="s"
              className="!min-h-[36px] text-[12.5px] px-4"
              onClick={() => {
                if (draft.trim()) {
                  a.addNote(c.id, draft.trim());
                  setDraft('');
                }
              }}
            >
              Save Note
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Inline Panel */}
      <div className="hidden xl:block w-[400px] flex-none">
        <Card className="anim-sl flex flex-col gap-4 border-bd bg-card shadow-xs rounded-[26px]">
          {panelInner}
        </Card>
      </div>

      {/* Tablet & Mobile Slide-In Overlay Drawer */}
      <div
        className="xl:hidden fixed inset-0 z-50 flex justify-end bg-[#0d1811]/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => a.select(null)}
      >
        <div
          onClick={e => e.stopPropagation()}
          className="anim-sl relative w-[420px] max-w-[90vw] h-full bg-card overflow-y-auto p-5 border-l border-bd shadow-2xl"
        >
          {panelInner}
        </div>
      </div>

      {/* Resolution Confirmation Modal with Fernly Signature dlg-in Animation */}
      {modal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1811]/60 p-4 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setModal(false)}
        >
          <div onClick={e => e.stopPropagation()}>
            <Card className="anim-dlg flex w-[400px] max-w-full flex-col gap-4 !p-6 shadow-2xl rounded-[26px] border-bd/80">
              <div id="modal-title" className="text-[17px] font-bold text-tx">
                Resolve Case {c.id}
              </div>
              <p className="text-[13px] text-mu">
                Select final determination for this transaction of{' '}
                <b className="num text-tx">{inr(c.amount)}</b>:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setChoice('fraud')}
                  className={`h-11 rounded-2xl border px-3 text-[13px] font-semibold transition-all duration-200 active:scale-95 cursor-pointer ${
                    choice === 'fraud'
                      ? 'border-rd bg-rd text-card shadow-sm'
                      : 'border-bd text-mu hover:bg-so/40'
                  }`}
                >
                  Confirmed Fraud
                </button>
                <button
                  type="button"
                  onClick={() => setChoice('fp')}
                  className={`h-11 rounded-2xl border px-3 text-[13px] font-semibold transition-all duration-200 active:scale-95 cursor-pointer ${
                    choice === 'fp'
                      ? 'border-ac bg-ac text-on shadow-sm'
                      : 'border-bd text-mu hover:bg-so/40'
                  }`}
                >
                  False Positive
                </button>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-bd/60">
                <Btn v="s" onClick={() => setModal(false)}>
                  Cancel
                </Btn>
                <Btn
                  onClick={() => {
                    a.decide(c.id, choice);
                    setModal(false);
                  }}
                >
                  Confirm Resolution
                </Btn>
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
