'use client';
import { useState } from 'react';
import {
  Plus,
  MoreHorizontal,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { useApp, Case } from '@/lib/store';
import { inr } from '@/lib/export';

type ColumnId = 'new' | 'investigating' | 'escalated' | 'resolved';

const COLUMNS: { id: ColumnId; label: string; dotColor: string }[] = [
  { id: 'new', label: 'New Alerts', dotColor: 'bg-[#f59e0b]' },
  { id: 'investigating', label: 'Under Investigation', dotColor: 'bg-[#3b82f6]' },
  { id: 'escalated', label: 'Pending Escalation', dotColor: 'bg-[#ef4444]' },
  { id: 'resolved', label: 'Resolved Cases', dotColor: 'bg-[#10b981]' },
];

export default function TasksKanban() {
  const { cases, say, select, selected, claim, escalate, decide, role } = useApp();
  const [filter, setFilter] = useState<'all' | 'priority' | 'high' | 'mine'>('all');
  const [draggingCaseId, setDraggingCaseId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ColumnId | null>(null);

  // Group cases into the 4 columns
  const getColumnCases = (colId: ColumnId) => {
    return cases.filter(c => {
      // Apply tab filters
      if (filter === 'priority' && c.score < 0.7) return false;
      if (filter === 'high' && c.amount < 100000) return false;
      if (filter === 'mine' && c.by !== role && !c.claimed) return false;

      if (colId === 'resolved') return !!c.res;
      if (colId === 'escalated') return !c.res && c.kind === 'escalate';
      if (colId === 'investigating') return !c.res && !!c.claimed && c.kind !== 'escalate';
      if (colId === 'new') return !c.res && !c.claimed && c.kind !== 'escalate';
      return false;
    });
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingCaseId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colId: ColumnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colId) setDragOverCol(colId);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, targetCol: ColumnId) => {
    e.preventDefault();
    setDragOverCol(null);
    const caseId = e.dataTransfer.getData('text/plain') || draggingCaseId;
    if (!caseId) return;

    if (targetCol === 'investigating') {
      claim(caseId);
      say(`Case ${caseId} claimed for investigation`);
    } else if (targetCol === 'escalated') {
      escalate(caseId);
      say(`Case ${caseId} escalated to Senior Analyst (15m SLA)`);
    } else if (targetCol === 'resolved') {
      decide(caseId, 'fp');
      say(`Case ${caseId} marked legitimate / cleared`);
    } else if (targetCol === 'new') {
      say(`Case ${caseId} returned to review triage queue`);
    }
    setDraggingCaseId(null);
  };

  const totalFiltered =
    getColumnCases('new').length +
    getColumnCases('investigating').length +
    getColumnCases('escalated').length +
    getColumnCases('resolved').length;

  return (
    <div className="flex flex-col gap-5 page-transition">
      {/* Board Head matching Fernly tasks style */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-tx leading-tight">Cases</h1>
          <p className="text-[13.5px] text-mu mt-0.5">
            Drag a case card to update investigation stage, or click to inspect details.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => say('Opening rapid case intake modal')}
            className="flex min-h-[42px] items-center gap-2 rounded-full bg-[#0d3a23] dark:bg-[#155a37] px-5 text-[13.5px] font-bold text-white shadow-sm hover:opacity-95 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <Plus size={16} />
            <span>New Case</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Counter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-card border border-bd/80 p-1 shadow-xs">
          {(
            [
              ['all', 'All Cases'],
              ['priority', 'Priority Flags (≥0.70)'],
              ['high', '₹1L+ High Value'],
              ['mine', 'My Active Cases'],
            ] as const
          ).map(([k, label]) => {
            const on = filter === k;
            return (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition-all duration-200 cursor-pointer ${
                  on
                    ? 'bg-[#0d3a23] text-white shadow-xs'
                    : 'text-mu hover:text-tx hover:bg-so/40'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="text-[12.5px] font-semibold text-mu">
          <span>{totalFiltered} cases displayed</span>
        </div>
      </div>

      {/* 4 Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map(col => {
          const colCases = getColumnCases(col.id);
          const isOver = dragOverCol === col.id;

          return (
            <div
              key={col.id}
              onDragOver={e => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, col.id)}
              className={`flex flex-col gap-3 rounded-[24px] border border-bd/80 bg-card/60 p-3.5 min-h-[620px] transition-colors duration-200 ${
                isOver ? 'task-drag-over bg-so/30 border-ac/50' : ''
              }`}
            >
              {/* Column Head */}
              <div className="flex items-center justify-between px-2 py-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.dotColor} ${isOver ? 'anim-live-pulse' : ''}`} />
                  <h2 className="text-[14px] font-bold text-tx">{col.label}</h2>
                </div>
                <span className="num flex h-5 min-w-[20px] items-center justify-center rounded-full bg-so px-2 text-[11px] font-bold text-tx transition-transform duration-200">
                  {colCases.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="flex flex-col gap-2.5">
                {colCases.map(c => {
                  const isSelected = selected === c.id;
                  const isDragging = draggingCaseId === c.id;

                  return (
                    <article
                      key={c.id}
                      draggable
                      onDragStart={e => handleDragStart(e, c.id)}
                      onDragEnd={() => setDraggingCaseId(null)}
                      onClick={() => select(c.id)}
                      className={`card-micro group relative flex flex-col gap-2.5 rounded-[20px] border bg-card p-4 shadow-xs transition-all duration-200 cursor-grab active:cursor-grabbing hover:border-ac/40 ${
                        isSelected
                          ? 'border-ac ring-2 ring-ac/30 bg-so/10'
                          : 'border-bd/80'
                      } ${isDragging ? 'task-dragging opacity-40 scale-95 rotate-1' : ''}`}
                    >
                      {/* Top row: Tags & Score */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-so/70 px-2.5 py-0.5 text-[10.5px] font-bold text-ac border border-ac/15">
                          {c.branch}
                        </span>
                        <span
                          className={`num rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                            c.score >= 0.75
                              ? 'bg-rb text-rd border border-rd/20'
                              : c.score >= 0.5
                              ? 'bg-ab text-am border border-am/20'
                              : 'bg-so text-ac border border-ac/20'
                          }`}
                        >
                          Risk: {(c.score * 100).toFixed(0)}%
                        </span>
                      </div>

                      {/* Case ID & Amount */}
                      <div>
                        <div className="flex items-baseline justify-between">
                          <h3 className="text-[15px] font-extrabold text-tx">{c.id}</h3>
                          <span className="num text-[14px] font-bold text-tx">
                            ₹{c.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-[12px] text-mu mt-1 line-clamp-2 leading-snug">
                          {c.reasons[0]}
                        </p>
                      </div>

                      {/* Card Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-bd/40 text-[11px] text-mu">
                        <div className="flex items-center gap-1.5">
                          {c.kind === 'escalate' ? (
                            <span className="flex items-center gap-1 font-semibold text-rd">
                              <AlertTriangle size={12} />
                              <span>15m SLA</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <ShieldCheck size={12} className="text-ac" />
                              <span>Branch Triage</span>
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            select(c.id);
                          }}
                          className="flex items-center gap-1 text-[11px] font-bold text-ac hover:underline cursor-pointer"
                        >
                          <span>Inspect</span>
                          <ArrowRight size={11} />
                        </button>
                      </div>
                    </article>
                  );
                })}

                {colCases.length === 0 && (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-[12px] text-mu border border-dashed border-bd/60 rounded-[18px]">
                    <span>No cases in this stage</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
