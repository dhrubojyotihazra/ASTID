'use client';
import { useState } from 'react';
import {
  Plus,
  Clock,
  MessageSquare,
  Flag,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  Filter,
  Layers,
} from 'lucide-react';
import { useApp } from '@/lib/store';

export type TaskStage = 'todo' | 'progress' | 'review' | 'done';

export type TaskItem = {
  id: string;
  title: string;
  category: 'Marketing' | 'Backend' | 'Frontend' | 'QA' | 'Design';
  priority: 'Low' | 'Medium' | 'High';
  due: string;
  notes: number;
  assignees: string[];
  stage: TaskStage;
  progressPercent?: number;
};

const INITIAL_TASKS: TaskItem[] = [
  {
    id: 't1',
    title: 'Onboarding email sequence',
    category: 'Marketing',
    priority: 'Low',
    due: 'In 12 days',
    notes: 0,
    assignees: ['LR', 'NB'],
    stage: 'todo',
    progressPercent: 0,
  },
  {
    id: 't6',
    title: 'Cut LCP under 2 seconds',
    category: 'Frontend',
    priority: 'High',
    due: 'In 5 days',
    notes: 3,
    assignees: ['OM'],
    stage: 'todo',
    progressPercent: 0,
  },
  {
    id: 't7',
    title: 'Saved filters for projects',
    category: 'Frontend',
    priority: 'Medium',
    due: 'In 6 days',
    notes: 2,
    assignees: ['HK'],
    stage: 'todo',
    progressPercent: 0,
  },
  {
    id: 't2',
    title: 'Passkey sign-in',
    category: 'Backend',
    priority: 'High',
    due: 'In 3 days',
    notes: 1,
    assignees: ['MS'],
    stage: 'progress',
    progressPercent: 65,
  },
  {
    id: 't3',
    title: 'Write API endpoint docs',
    category: 'Backend',
    priority: 'Low',
    due: 'In 9 days',
    notes: 1,
    assignees: ['MS'],
    stage: 'progress',
    progressPercent: 40,
  },
  {
    id: 't8',
    title: 'Marketing site refresh',
    category: 'Frontend',
    priority: 'Medium',
    due: 'In 4 days',
    notes: 3,
    assignees: ['OM', 'HK'],
    stage: 'progress',
    progressPercent: 55,
  },
  {
    id: 't9',
    title: 'Q4 launch announcement',
    category: 'Marketing',
    priority: 'Medium',
    due: 'In 8 days',
    notes: 1,
    assignees: ['NB'],
    stage: 'progress',
    progressPercent: 30,
  },
  {
    id: 't4',
    title: 'Safari & Firefox regression pass',
    category: 'QA',
    priority: 'Medium',
    due: 'Tomorrow',
    notes: 5,
    assignees: ['SS'],
    stage: 'review',
    progressPercent: 85,
  },
  {
    id: 't10',
    title: 'App icon illustration set',
    category: 'Design',
    priority: 'Medium',
    due: 'In 2 days',
    notes: 6,
    assignees: ['MK'],
    stage: 'review',
    progressPercent: 90,
  },
  {
    id: 't5',
    title: 'Monorepo cleanup',
    category: 'Backend',
    priority: 'Low',
    due: 'Oct 29',
    notes: 2,
    assignees: ['PR'],
    stage: 'done',
    progressPercent: 100,
  },
  {
    id: 't11',
    title: 'Dashboard analytics widgets',
    category: 'Frontend',
    priority: 'High',
    due: 'Oct 30',
    notes: 9,
    assignees: ['HK', 'PR'],
    stage: 'done',
    progressPercent: 100,
  },
  {
    id: 't12',
    title: 'Kickoff with Halcyon Labs',
    category: 'Marketing',
    priority: 'Medium',
    due: 'Oct 28',
    notes: 4,
    assignees: ['NC', 'LR'],
    stage: 'done',
    progressPercent: 100,
  },
  {
    id: 't13',
    title: 'Design login & sign-up screens',
    category: 'Design',
    priority: 'High',
    due: 'Nov 2',
    notes: 4,
    assignees: ['PR', 'MK'],
    stage: 'done',
    progressPercent: 100,
  },
];

const COLUMNS: { id: TaskStage; label: string; dotColor: string }[] = [
  { id: 'todo', label: 'To do', dotColor: '#94a3b8' },
  { id: 'progress', label: 'In progress', dotColor: '#f59e0b' },
  { id: 'review', label: 'In review', dotColor: '#3b82f6' },
  { id: 'done', label: 'Done', dotColor: '#10b981' },
];

const CATEGORY_COLORS: Record<string, { fg: string; bg: string }> = {
  Marketing: { fg: '#b45309', bg: '#fef3c7' },
  Backend: { fg: '#1d4ed8', bg: '#dbeafe' },
  Frontend: { fg: '#047857', bg: '#d1fae5' },
  QA: { fg: '#6d28d9', bg: '#ede9fe' },
  Design: { fg: '#be185d', bg: '#fce7f3' },
};

const AVATAR_COLORS: Record<string, string> = {
  LR: '#fde047',
  NB: '#fed7aa',
  OM: '#fef08a',
  HK: '#e9d5ff',
  MS: '#bbf7d0',
  SS: '#fbcfe8',
  MK: '#fef08a',
  PR: '#fed7aa',
  NC: '#fed7aa',
};

export default function TasksKanban() {
  const { say } = useApp();
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [activeFilter, setActiveFilter] = useState<'all' | 'mine' | 'high' | 'week'>('all');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStage | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TaskItem['category']>('Frontend');
  const [newPriority, setNewPriority] = useState<TaskItem['priority']>('Medium');
  const [newStage, setNewStage] = useState<TaskStage>('todo');

  const filteredTasks = tasks.filter(t => {
    if (activeFilter === 'mine') return t.assignees.includes('NC') || t.assignees.includes('PR');
    if (activeFilter === 'high') return t.priority === 'High';
    if (activeFilter === 'week') return t.due.includes('days') || t.due.includes('Tomorrow');
    return true;
  });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colId: TaskStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleDragLeave = (colId: TaskStage) => {
    if (dragOverCol === colId) {
      setDragOverCol(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStage: TaskStage) => {
    e.preventDefault();
    setDragOverCol(null);
    const id = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!id) return;

    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (task.stage === targetStage) return;

    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? {
              ...t,
              stage: targetStage,
              progressPercent: targetStage === 'done' ? 100 : targetStage === 'todo' ? 0 : 50,
            }
          : t
      )
    );

    const colName = COLUMNS.find(c => c.id === targetStage)?.label || targetStage;
    say(`Moved "${task.title}" to ${colName}`);
    setDraggedTaskId(null);
  };

  const handleMoveTo = (id: string, targetStage: TaskStage) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? {
              ...t,
              stage: targetStage,
              progressPercent: targetStage === 'done' ? 100 : targetStage === 'todo' ? 0 : 50,
            }
          : t
      )
    );
    setActiveMenuId(null);
    const colName = COLUMNS.find(c => c.id === targetStage)?.label || targetStage;
    say(`Moved task to ${colName}`);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: TaskItem = {
      id: 't-' + Date.now(),
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      due: 'In 7 days',
      notes: 0,
      assignees: ['NC'],
      stage: newStage,
      progressPercent: newStage === 'done' ? 100 : 0,
    };

    setTasks(prev => [newTask, ...prev]);
    setIsModalOpen(false);
    setNewTitle('');
    say(`Added task "${newTask.title}"`);
  };

  return (
    <div className="flex flex-col gap-5 page-transition">
      {/* Board Header matching Screen 2 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-tx leading-tight">Tasks</h1>
          <p className="text-[13.5px] text-mu mt-0.5">
            Drag a card to another stage, or use its menu to move it.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex min-h-[42px] items-center gap-2 rounded-full bg-[#0d3a23] dark:bg-[#155a37] px-5 text-[13.5px] font-bold text-white shadow-sm hover:opacity-95 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <Plus size={16} />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-card border border-bd/80 p-1 shadow-xs">
          {(
            [
              ['all', 'All'],
              ['mine', 'My tasks'],
              ['high', 'High priority'],
              ['week', 'Due this week'],
            ] as const
          ).map(([k, label]) => {
            const on = activeFilter === k;
            return (
              <button
                key={k}
                onClick={() => setActiveFilter(k)}
                aria-pressed={on}
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
        <div className="text-[12.5px] font-medium text-mu">
          {filteredTasks.length} tasks shown
        </div>
      </div>

      {/* 4-Column Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map(col => {
          const colTasks = filteredTasks.filter(t => t.stage === col.id);
          const isOver = dragOverCol === col.id;

          return (
            <div
              key={col.id}
              onDragOver={e => handleDragOver(e, col.id)}
              onDragLeave={() => handleDragLeave(col.id)}
              onDrop={e => handleDrop(e, col.id)}
              className={`flex flex-col gap-3 rounded-[24px] border transition-all duration-200 p-3.5 min-h-[540px] ${
                isOver
                  ? 'border-[#155a37] bg-[#e3f2e9]/50 dark:bg-[#1e2b24]/60 shadow-md'
                  : 'border-bd/70 bg-[#f5f6f5]/70 dark:bg-[#141c17]/60'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-1.5 pt-1">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: col.dotColor }}
                  />
                  <h2 className="text-[14.5px] font-bold text-tx">{col.label}</h2>
                </div>
                <span className="num flex h-6 min-w-[24px] items-center justify-center rounded-full bg-card border border-bd/80 px-2 text-[12px] font-bold text-mu shadow-xs">
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards Container */}
              <div className="flex flex-col gap-3 flex-1">
                {colTasks.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-bd/80 p-6 text-center text-[12.5px] text-mu/80">
                    Drop a task here
                  </div>
                ) : (
                  colTasks.map(task => {
                    const isDragging = draggedTaskId === task.id;
                    const catStyle = CATEGORY_COLORS[task.category] || { fg: '#1d7347', bg: '#e3f2e9' };

                    return (
                      <article
                        key={task.id}
                        draggable
                        onDragStart={e => handleDragStart(e, task.id)}
                        className={`group relative flex flex-col gap-2.5 rounded-[20px] border border-bd/90 bg-card p-4 shadow-xs transition-all duration-200 cursor-grab active:cursor-grabbing hover:-translate-y-0.5 hover:shadow-md ${
                          isDragging ? 'opacity-40 scale-[0.98] ring-2 ring-[#0d3a23]' : ''
                        }`}
                      >
                        {/* Top: Category Tag & Priority */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-tight"
                              style={{ color: catStyle.fg, backgroundColor: catStyle.bg }}
                            >
                              {task.category}
                            </span>
                            <span
                              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                task.priority === 'High'
                                  ? 'text-rd bg-rb'
                                  : task.priority === 'Medium'
                                  ? 'text-am bg-ab'
                                  : 'text-mu bg-so/50'
                              }`}
                            >
                              <Flag size={10} />
                              <span>{task.priority}</span>
                            </span>
                          </div>

                          {/* Quick Menu Button */}
                          <div className="relative">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === task.id ? null : task.id);
                              }}
                              aria-label="Move task menu"
                              className="flex h-7 w-7 items-center justify-center rounded-full text-mu hover:bg-so/60 hover:text-tx transition cursor-pointer"
                            >
                              <MoreHorizontal size={15} />
                            </button>

                            {/* Dropdown Menu */}
                            {activeMenuId === task.id && (
                              <div
                                onClick={e => e.stopPropagation()}
                                className="anim-dlg absolute right-0 top-8 z-30 flex w-40 flex-col gap-1 rounded-2xl border border-bd bg-card p-1.5 shadow-xl text-[12.5px]"
                              >
                                <div className="px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-mu">
                                  Move to
                                </div>
                                {COLUMNS.filter(c => c.id !== task.stage).map(target => (
                                  <button
                                    key={target.id}
                                    onClick={() => handleMoveTo(task.id, target.id)}
                                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left font-medium text-tx hover:bg-so/80 transition cursor-pointer"
                                  >
                                    <span
                                      className="h-2 w-2 rounded-full"
                                      style={{ backgroundColor: target.dotColor }}
                                    />
                                    <span>{target.label}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-[14px] font-bold text-tx leading-snug">
                          {task.title}
                        </h3>

                        {/* Progress meter line */}
                        {task.progressPercent !== undefined && task.progressPercent > 0 && (
                          <div className="w-full h-1 overflow-hidden rounded-full bg-so">
                            <div
                              className="h-full bg-[#155a37] rounded-full transition-all duration-300"
                              style={{ width: `${task.progressPercent}%` }}
                            />
                          </div>
                        )}

                        {/* Foot: Due Date, Comments, Assignees */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-bd/40 text-[11.5px] text-mu">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              <span>{task.due}</span>
                            </span>
                            {task.notes > 0 && (
                              <span className="flex items-center gap-1">
                                <MessageSquare size={12} />
                                <span>{task.notes}</span>
                              </span>
                            )}
                          </div>

                          {/* Assignee Avatar Stack */}
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {task.assignees.map((init, i) => (
                              <div
                                key={i}
                                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card text-[10px] font-bold text-tx shadow-2xs"
                                style={{ backgroundColor: AVATAR_COLORS[init] || '#e2e8f0' }}
                              >
                                {init}
                              </div>
                            ))}
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal Dialog */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1811]/50 backdrop-blur-xs p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="anim-dlg w-full max-w-md rounded-[26px] border border-bd bg-card p-6 shadow-2xl flex flex-col gap-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-bd/60">
              <h2 className="text-[17px] font-bold text-tx">Create New Task</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-mu hover:text-tx text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTask} className="flex flex-col gap-4">
              <div>
                <label className="text-[12px] font-semibold text-mu block mb-1">
                  Task Title
                </label>
                <input
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Implement Webhook retry policy"
                  className="w-full rounded-xl border border-bd bg-card px-3.5 py-2.5 text-[13.5px] text-tx focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-semibold text-mu block mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-bd bg-card px-3 py-2 text-[13px] text-tx"
                  >
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Design">Design</option>
                    <option value="QA">QA</option>
                  </select>
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-mu block mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as any)}
                    className="w-full rounded-xl border border-bd bg-card px-3 py-2 text-[13px] text-tx"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-mu block mb-1">
                  Starting Column
                </label>
                <select
                  value={newStage}
                  onChange={e => setNewStage(e.target.value as any)}
                  className="w-full rounded-xl border border-bd bg-card px-3 py-2 text-[13px] text-tx"
                >
                  <option value="todo">To do</option>
                  <option value="progress">In progress</option>
                  <option value="review">In review</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-bd/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full px-4 py-2 text-[13px] font-semibold text-mu hover:bg-so/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#0d3a23] dark:bg-[#155a37] px-5 py-2 text-[13px] font-bold text-white shadow-xs hover:opacity-95"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
