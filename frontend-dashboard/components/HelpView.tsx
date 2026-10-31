'use client';
import { useState } from 'react';
import {
  Search,
  BookOpen,
  CheckSquare,
  Users,
  CreditCard,
  Plus,
  MessageCircle,
  Mail,
  Command,
} from 'lucide-react';
import { useApp } from '@/lib/store';

const FAQS = [
  {
    q: 'How do I create my first project?',
    a: 'Click the "+ Add Project" button at the top right of your Dashboard or Projects section. Enter the project name, assign team members, specify target milestones, and click Create.',
  },
  {
    q: 'Can I import projects from a spreadsheet?',
    a: 'Yes. On the Dashboard, click "Import Data" next to Add Project. Upload your CSV containing columns for project title, assignee initials, due date, and priority status.',
  },
  {
    q: 'How do I move a task to another stage?',
    a: 'You can drag and drop any card across the 4 Kanban columns (To do, In progress, In review, Done). Alternatively, click the "..." menu on any card or use the Alt + [ / ] keyboard shortcut.',
  },
  {
    q: 'What does the progress gauge measure?',
    a: 'The progress gauge displays the proportion of projects concluded against your active sprint cycle (completed projects in green, running streams in dark green, and pending in striped pattern).',
  },
  {
    q: 'How do I invite a teammate?',
    a: 'Navigate to the Team tab from the left sidebar, click "+ Invite member", provide their work email address, select their department, and an instant onboarding link will be sent.',
  },
  {
    q: 'Who can see my time tracker?',
    a: 'Time logged on the Time Tracker is private to you until a session is finalized and submitted against an active project sprint.',
  },
  {
    q: 'Is there a free plan?',
    a: 'Yes, Fernly RiskOps provides a complimentary tier for independent teams and pilot clusters up to 10 active operational users.',
  },
  {
    q: 'How do I change my accent colour?',
    a: 'Head into Settings > Appearance, where you can switch between Deep Forest, Emerald Calm, and Cobalt Trust accents.',
  },
];

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], desc: 'Search' },
  { keys: ['/'], desc: 'Search, from anywhere' },
  { keys: ['G', 'D'], desc: 'Go to dashboard' },
  { keys: ['G', 'T'], desc: 'Go to tasks' },
  { keys: ['G', 'C'], desc: 'Go to calendar' },
  { keys: ['Alt', '–', '+'], desc: 'Move a focused task card' },
  { keys: ['Esc'], desc: 'Close menus and dialogs' },
];

export default function HelpView() {
  const { say } = useApp();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = FAQS.filter(
    f =>
      !searchQuery ||
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 page-transition">
      {/* Board Head matching Screen 6 */}
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-tx leading-tight">Help center</h1>
        <p className="text-[13.5px] text-mu mt-0.5">
          Answers, shortcuts, and a human when you need one.
        </p>
      </div>

      {/* Top Hero Banner matching Screen 6 */}
      <section className="help-hero-banner relative rounded-[28px] p-8 md:p-10 shadow-lg text-white">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-[24px] md:text-[28px] font-extrabold tracking-tight mb-2">
            How can we help?
          </h2>
          <p className="text-[14px] text-white/80 mb-6">
            Type in the search bar above, or pick a topic.
          </p>
        </div>

        {/* 4 Topic Cards */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-2">
          {[
            { title: 'Getting started', count: '2 articles', icon: BookOpen },
            { title: 'Projects & tasks', count: '2 articles', icon: CheckSquare },
            { title: 'Team', count: '2 articles', icon: Users },
            { title: 'Billing & plans', count: '2 articles', icon: CreditCard },
          ].map((topic, i) => {
            const Icon = topic.icon;
            return (
              <button
                key={i}
                onClick={() => say(`Viewing topic: ${topic.title}`)}
                className="flex items-center gap-3.5 rounded-2xl bg-white/10 hover:bg-white/18 p-4 text-left backdrop-blur-md border border-white/15 transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white">
                  <Icon size={18} />
                </div>
                <div>
                  <div className="text-[14px] font-bold text-white">{topic.title}</div>
                  <div className="text-[12px] text-white/70">{topic.count}</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Grid: FAQ Accordion (Left) + Shortcuts & Stuck Card (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Frequently Asked Accordion (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-2 rounded-[26px] border border-bd/80 bg-card p-6 md:p-8 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-bd/60 mb-2">
            <h2 className="text-[17px] font-bold text-tx">Frequently asked</h2>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[12px] text-ac font-semibold"
              >
                Clear filter
              </button>
            )}
          </div>

          <div className="flex flex-col divide-y divide-bd/60">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="py-3">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 text-left py-1 text-[14.5px] font-bold text-tx hover:text-ac transition cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full bg-so text-ac text-[14px] font-bold transition-transform duration-200 ${
                        isOpen ? 'rotate-45' : ''
                      }`}
                    >
                      +
                    </span>
                  </button>
                  {isOpen && (
                    <p className="mt-2 text-[13px] text-mu leading-relaxed anim-up">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Keyboard Shortcuts + Still Stuck Card (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Keyboard Shortcuts Card */}
          <div className="rounded-[26px] border border-bd/80 bg-card p-6 shadow-xs flex flex-col gap-3">
            <h2 className="text-[16px] font-bold text-tx">Keyboard shortcuts</h2>
            <div className="flex flex-col gap-2 pt-1">
              {SHORTCUTS.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-[12.5px] py-1 border-b border-bd/40 last:border-b-0">
                  <div className="flex items-center gap-1">
                    {s.keys.map((k, j) => (
                      <kbd
                        key={j}
                        className="rounded-lg border border-bd bg-so/60 px-2 py-0.5 text-[11px] font-mono font-bold text-tx shadow-2xs"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                  <span className="text-mu text-right font-medium">{s.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Still Stuck Dark Wavy Card */}
          <div className="time-tracker-card rounded-[26px] p-6 text-white shadow-md flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white">
                <MessageCircle size={20} />
              </div>
              <h3 className="text-[17px] font-extrabold tracking-tight">Still stuck?</h3>
            </div>
            <p className="text-[13px] text-white/80 leading-relaxed">
              Our team answers in under 10 minutes, Monday to Friday.
            </p>
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => say('Opening live support chat...')}
                className="flex-1 flex min-h-[38px] items-center justify-center rounded-full bg-white text-[#0d3a23] text-[12.5px] font-bold shadow-xs hover:bg-white/90 active:scale-95 transition cursor-pointer"
              >
                Start a chat
              </button>
              <button
                type="button"
                onClick={() => say('Opening email client to help@fernly.app')}
                className="flex-1 flex min-h-[38px] items-center justify-center rounded-full border border-white/30 text-white text-[12.5px] font-semibold hover:bg-white/10 active:scale-95 transition cursor-pointer"
              >
                Email us
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
