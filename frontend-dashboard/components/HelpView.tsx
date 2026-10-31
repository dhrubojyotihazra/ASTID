'use client';
import { useState } from 'react';
import {
  Search,
  BookOpen,
  CheckSquare,
  Users,
  FileText,
  Plus,
  MessageCircle,
  Mail,
  Command,
  Download,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '@/lib/store';

const FAQS = [
  {
    q: 'How do I review a flagged transaction?',
    a: 'Navigate to Cases in the sidebar. Click on any flagged card to open the case inspection side-panel. The panel displays transaction amounts, risk scores, velocity indicators, and transaction journey hops. You can record notes and commit determinations (Confirmed Fraud or False Positive).',
  },
  {
    q: 'How do I upload a batch of transactions for offline scoring?',
    a: 'Admins can navigate to Batch Upload from the sidebar. Drag and drop any Parquet or CSV transaction archive, select your target branch hub, and click Start Ingestion. The calibrated XGBoost + Autoencoder pipeline will score every record in real-time.',
  },
  {
    q: 'How do I escalate an urgent high-risk case to a senior analyst?',
    a: 'On any case in the Cases board or queue, click the Escalate button or drag the card into the "Pending Escalation" column. The case routes immediately to Senior Analysts under a strict 15-minute resolution SLA.',
  },
  {
    q: 'What does the Detection Catch Rate measure?',
    a: 'The detection catch rate represents the proportion of true fraud events detected by our hybrid behavioral engine (94.21% on verified historical test archives), compared against static legacy rules (0.19%).',
  },
  {
    q: 'How does the 15-Minute SLA timer work?',
    a: 'When a case is escalated, a real-time countdown timer begins. If the timer reaches 0 before a determination is recorded, the case turns red and flags an operational SLA breach visible to the Risk Operations Lead.',
  },
  {
    q: 'Where do committed decisions go?',
    a: 'Every determination is committed to the immutable Investigator Audit Trail with an exact timestamp, investigator ID, case number, and decision outcome. Leads and Admins can export this trail as CSV.',
  },
  {
    q: 'Can I simulate workload changes if we adjust risk thresholds?',
    a: 'Yes. Team Leads can navigate to the Threshold Simulator to drag sliders for review cutoffs and escalation cutoffs, simulating real-time automation ratios and investigator queue volume.',
  },
  {
    q: 'How do I switch active roles for examiner walkthroughs?',
    a: 'Click your profile avatar in the upper right header to reveal the quick role switcher menu. Select Branch Analyst, Senior Analyst, Team Lead, or Admin to immediately view the interface from that role perspective.',
  },
];

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], desc: 'Search cases & people' },
  { keys: ['/'], desc: 'Quick search focus' },
  { keys: ['G', 'D'], desc: 'Go to dashboard' },
  { keys: ['G', 'C'], desc: 'Go to cases board' },
  { keys: ['G', 'A'], desc: 'Go to analytics & health' },
  { keys: ['Alt', '–', '+'], desc: 'Move focused case card' },
  { keys: ['Esc'], desc: 'Close dialogs and side-panel' },
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
      {/* Board Head matching Sentinel style */}
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-tx leading-tight">Help Center</h1>
        <p className="text-[13.5px] text-mu mt-0.5">
          Operational protocols, system guidelines, and examiner walkthrough instructions.
        </p>
      </div>

      {/* Top Hero Banner */}
      <section className="help-hero-banner relative rounded-[28px] p-8 md:p-10 shadow-lg text-white">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-[24px] md:text-[28px] font-extrabold tracking-tight mb-2">
            ASTID Fraud Defense Knowledge Base
          </h2>
          <p className="text-[14px] text-white/80 mb-6">
            Search operational procedures, verification protocols, or pick a guide below.
          </p>
        </div>

        {/* 4 Topic Cards */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-2">
          {[
            { title: 'Triage & Ingestion', count: '4 guides', icon: BookOpen },
            { title: 'Cases & Escalations', count: '6 guides', icon: CheckSquare },
            { title: 'Team & Supervisory', count: '3 guides', icon: Users },
            { title: 'Audits & Exports', count: '2 guides', icon: Download },
          ].map((topic, i) => {
            const Icon = topic.icon;
            return (
              <button
                key={i}
                onClick={() => say(`Viewing topic guide: ${topic.title}`)}
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
            <h2 className="text-[17px] font-bold text-tx">Frequently Asked Questions</h2>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[12px] text-ac font-semibold cursor-pointer"
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

        {/* Right: Keyboard Shortcuts + Support Card (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Keyboard Shortcuts Card */}
          <div className="rounded-[26px] border border-bd/80 bg-card p-6 shadow-xs flex flex-col gap-3">
            <h2 className="text-[16px] font-bold text-tx">Operational Shortcuts</h2>
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

          {/* Direct Support Card */}
          <div className="time-tracker-card rounded-[26px] p-6 text-white shadow-md flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white">
                <ShieldAlert size={20} />
              </div>
              <h3 className="text-[17px] font-extrabold tracking-tight">Lead Incident Desk</h3>
            </div>
            <p className="text-[13px] text-white/80 leading-relaxed">
              For high-severity fraud ring outbreaks or critical engine alerts, escalate directly to the central risk desk.
            </p>
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => say('Opening direct channel to Central Risk Desk...')}
                className="flex-1 flex min-h-[38px] items-center justify-center rounded-full bg-white text-[#0d3a23] text-[12.5px] font-bold shadow-xs hover:bg-white/90 active:scale-95 transition cursor-pointer"
              >
                Contact Lead
              </button>
              <button
                type="button"
                onClick={() => say('Operational handbook dispatched to examiner email.')}
                className="flex-1 flex min-h-[38px] items-center justify-center rounded-full border border-white/30 text-white text-[12.5px] font-semibold hover:bg-white/10 active:scale-95 transition cursor-pointer"
              >
                Handbook
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
