'use client';
import { useState } from 'react';
import { Plus, MessageSquare, User, Check, Send } from 'lucide-react';
import { useApp } from '@/lib/store';
import { ROLES } from '@/lib/roles';

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  dept: 'Management' | 'Design' | 'Engineering' | 'Marketing';
  status: 'online' | 'away' | 'offline';
  openTasks: number;
  completedTasks: number;
  workload: number;
  init: string;
  avatarBg: string;
};

const MEMBERS: TeamMember[] = [
  {
    id: 'nc',
    name: 'Noah Castell',
    role: 'Project Lead',
    dept: 'Management',
    status: 'online',
    openTasks: 0,
    completedTasks: 48,
    workload: 64,
    init: 'NC',
    avatarBg: '#fed7aa',
  },
  {
    id: 'pr',
    name: 'Priya Raman',
    role: 'Product Designer',
    dept: 'Design',
    status: 'online',
    openTasks: 0,
    completedTasks: 39,
    workload: 72,
    init: 'PR',
    avatarBg: '#fbcfe8',
  },
  {
    id: 'ms',
    name: 'Mateo Silva',
    role: 'Backend Engineer',
    dept: 'Engineering',
    status: 'online',
    openTasks: 2,
    completedTasks: 51,
    workload: 88,
    init: 'MS',
    avatarBg: '#bbf7d0',
  },
  {
    id: 'hk',
    name: 'Hana Kobayashi',
    role: 'Frontend Engineer',
    dept: 'Engineering',
    status: 'away',
    openTasks: 2,
    completedTasks: 33,
    workload: 56,
    init: 'HK',
    avatarBg: '#e9d5ff',
  },
  {
    id: 'om',
    name: 'Owen Mercer',
    role: 'Frontend Engineer',
    dept: 'Engineering',
    status: 'online',
    openTasks: 2,
    completedTasks: 42,
    workload: 79,
    init: 'OM',
    avatarBg: '#fef08a',
  },
  {
    id: 'ss',
    name: 'Sofia Sato',
    role: 'QA Engineer',
    dept: 'Engineering',
    status: 'online',
    openTasks: 1,
    completedTasks: 27,
    workload: 41,
    init: 'SS',
    avatarBg: '#fed7aa',
  },
  {
    id: 'mk',
    name: 'Maya Kovac',
    role: 'Brand Designer',
    dept: 'Design',
    status: 'away',
    openTasks: 1,
    completedTasks: 24,
    workload: 50,
    init: 'MK',
    avatarBg: '#bae6fd',
  },
  {
    id: 'lr',
    name: 'Liam Reyes',
    role: 'Marketing Lead',
    dept: 'Marketing',
    status: 'online',
    openTasks: 1,
    completedTasks: 30,
    workload: 67,
    init: 'LR',
    avatarBg: '#fed7aa',
  },
  {
    id: 'nb',
    name: 'Nadia Bello',
    role: 'Content Strategist',
    dept: 'Marketing',
    status: 'offline',
    openTasks: 2,
    completedTasks: 19,
    workload: 35,
    init: 'NB',
    avatarBg: '#fef08a',
  },
];

export default function TeamView() {
  const { say, role } = useApp();
  const [deptFilter, setDeptFilter] = useState<'all' | 'Engineering' | 'Design' | 'Marketing' | 'Management'>('all');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [activeMessageTarget, setActiveMessageTarget] = useState<TeamMember | null>(null);
  const [messageText, setMessageText] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<TeamMember | null>(null);

  const filtered = MEMBERS.filter(m => deptFilter === 'all' || m.dept === deptFilter);
  const onlineCount = MEMBERS.filter(m => m.status === 'online').length;

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteModalOpen(false);
    setInviteEmail('');
    say(`Invitation sent to ${inviteEmail}`);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText || !activeMessageTarget) return;
    const name = activeMessageTarget.name;
    setActiveMessageTarget(null);
    setMessageText('');
    say(`Message sent to ${name}`);
  };

  return (
    <div className="flex flex-col gap-5 page-transition">
      {/* Board Head matching Screen 4 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-tx leading-tight">Team</h1>
          <p className="text-[13.5px] text-mu mt-0.5">
            Everyone on the workspace, what they're carrying and who's around.
          </p>
        </div>
        <button
          onClick={() => setInviteModalOpen(true)}
          className="flex min-h-[42px] items-center gap-2 rounded-full bg-[#0d3a23] dark:bg-[#155a37] px-5 text-[13.5px] font-bold text-white shadow-sm hover:opacity-95 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <Plus size={16} />
          <span>Invite member</span>
        </button>
      </div>

      {/* Department Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-card border border-bd/80 p-1 shadow-xs">
          {(
            [
              ['all', 'All'],
              ['Engineering', 'Engineering'],
              ['Design', 'Design'],
              ['Marketing', 'Marketing'],
              ['Management', 'Management'],
            ] as const
          ).map(([k, label]) => {
            const on = deptFilter === k;
            return (
              <button
                key={k}
                onClick={() => setDeptFilter(k)}
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

        <div className="flex items-center gap-2 text-[12.5px] font-semibold text-mu">
          <span className="h-2 w-2 rounded-full bg-ac animate-pulse" />
          <span>{onlineCount} online now</span>
        </div>
      </div>

      {/* 10 Member Cards Grid (2 rows of 5 on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {filtered.map(m => (
          <article
            key={m.id}
            className="flex flex-col justify-between rounded-[24px] border border-bd/80 bg-card p-5 text-center shadow-xs interactive-hover"
          >
            {/* Avatar & Online status dot */}
            <div className="relative mx-auto mb-3">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full text-[17px] font-bold text-tx shadow-xs"
                style={{ backgroundColor: m.avatarBg }}
              >
                {m.init}
              </div>
              <span
                className={`absolute bottom-0 right-1 h-3.5 w-3.5 rounded-full border-2 border-card ${
                  m.status === 'online'
                    ? 'bg-[#10b981]'
                    : m.status === 'away'
                    ? 'bg-[#f59e0b]'
                    : 'bg-[#94a3b8]'
                }`}
              />
            </div>

            {/* Name & Role */}
            <h2 className="text-[15px] font-bold text-tx leading-tight">{m.name}</h2>
            <p className="text-[12px] text-mu mt-0.5">{m.role}</p>

            {/* Department tag */}
            <div className="my-2.5">
              <span className="inline-block rounded-full bg-so/70 px-2.5 py-0.5 text-[11px] font-semibold text-ac border border-ac/15">
                {m.dept}
              </span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-2 border-y border-bd/50 py-2.5 text-[12px]">
              <div>
                <b className="num block text-[15px] font-extrabold text-tx">{m.openTasks}</b>
                <span className="text-[11px] text-mu">Open tasks</span>
              </div>
              <div>
                <b className="num block text-[15px] font-extrabold text-tx">{m.completedTasks}</b>
                <span className="text-[11px] text-mu">Completed</span>
              </div>
            </div>

            {/* Workload Progress Bar */}
            <div className="my-3 text-left">
              <div className="flex justify-between text-[11.5px] font-semibold text-mu mb-1">
                <span>Workload</span>
                <span className="num font-bold text-tx">{m.workload}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-so">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${m.workload}%`,
                    backgroundColor:
                      m.workload > 80 ? '#b45309' : m.workload > 60 ? '#155a37' : '#5dbd8b',
                  }}
                />
              </div>
            </div>

            {/* Actions: Message & Profile buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveMessageTarget(m)}
                className="flex min-h-[36px] items-center justify-center rounded-full border border-bd bg-card px-3 text-[12px] font-semibold text-tx hover:bg-so/40 active:scale-95 transition cursor-pointer"
              >
                Message
              </button>
              <button
                type="button"
                onClick={() => setSelectedProfile(m)}
                className="flex min-h-[36px] items-center justify-center rounded-full bg-[#0d3a23] dark:bg-[#155a37] px-3 text-[12px] font-bold text-white hover:opacity-95 active:scale-95 transition cursor-pointer"
              >
                Profile
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Message Modal */}
      {activeMessageTarget && (
        <div
          onClick={() => setActiveMessageTarget(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1811]/50 backdrop-blur-xs p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="anim-dlg w-full max-w-md rounded-[26px] border border-bd bg-card p-6 shadow-2xl flex flex-col gap-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-bd/60">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold text-tx"
                  style={{ backgroundColor: activeMessageTarget.avatarBg }}
                >
                  {activeMessageTarget.init}
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-tx">
                    Message {activeMessageTarget.name}
                  </h3>
                  <div className="text-[11.5px] text-mu">{activeMessageTarget.role}</div>
                </div>
              </div>
              <button
                onClick={() => setActiveMessageTarget(null)}
                className="text-mu hover:text-tx text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="flex flex-col gap-4">
              <textarea
                required
                rows={4}
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                placeholder={`Write a quick calm note to ${activeMessageTarget.name}...`}
                className="w-full rounded-2xl border border-bd bg-card p-3.5 text-[13.5px] text-tx focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac"
              />

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveMessageTarget(null)}
                  className="rounded-full px-4 py-2 text-[13px] font-semibold text-mu hover:bg-so/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-full bg-[#0d3a23] dark:bg-[#155a37] px-5 py-2 text-[13px] font-bold text-white shadow-xs hover:opacity-95"
                >
                  <Send size={14} />
                  <span>Send Message</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Profile Drawer / Modal */}
      {selectedProfile && (
        <div
          onClick={() => setSelectedProfile(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1811]/50 backdrop-blur-xs p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="anim-dlg w-full max-w-lg rounded-[26px] border border-bd bg-card p-6 shadow-2xl flex flex-col gap-4"
          >
            <div className="flex items-center justify-between pb-4 border-b border-bd/60">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full text-[18px] font-bold text-tx"
                  style={{ backgroundColor: selectedProfile.avatarBg }}
                >
                  {selectedProfile.init}
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-tx">{selectedProfile.name}</h3>
                  <div className="text-[12.5px] text-mu">
                    {selectedProfile.role} · {selectedProfile.dept}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedProfile(null)}
                className="text-mu hover:text-tx text-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-so/30 p-3 border border-bd/40">
                <span className="text-[11.5px] text-mu block">Open Tasks</span>
                <b className="num text-[18px] font-extrabold text-tx">{selectedProfile.openTasks}</b>
              </div>
              <div className="rounded-2xl bg-so/30 p-3 border border-bd/40">
                <span className="text-[11.5px] text-mu block">Completed</span>
                <b className="num text-[18px] font-extrabold text-tx">{selectedProfile.completedTasks}</b>
              </div>
              <div className="rounded-2xl bg-so/30 p-3 border border-bd/40">
                <span className="text-[11.5px] text-mu block">Workload</span>
                <b className="num text-[18px] font-extrabold text-tx">{selectedProfile.workload}%</b>
              </div>
            </div>

            <div className="text-[13px] text-tx/85 bg-so/20 rounded-2xl p-4 border border-bd/40">
              <b>Responsibility Scope:</b> Active contributor across sprint roadmaps, code reviews, and cross-functional feature delivery with 100% on-time delivery record.
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedProfile(null)}
                className="rounded-full bg-[#0d3a23] dark:bg-[#155a37] px-6 py-2.5 text-[13px] font-bold text-white shadow-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div
          onClick={() => setInviteModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1811]/50 backdrop-blur-xs p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="anim-dlg w-full max-w-md rounded-[26px] border border-bd bg-card p-6 shadow-2xl flex flex-col gap-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-bd/60">
              <h2 className="text-[17px] font-bold text-tx">Invite Workspace Teammate</h2>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="text-mu hover:text-tx text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="flex flex-col gap-4">
              <div>
                <label className="text-[12px] font-semibold text-mu block mb-1">
                  Teammate Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="e.g. colleague@bank.org"
                  className="w-full rounded-xl border border-bd bg-card px-3.5 py-2.5 text-[13.5px] text-tx focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac"
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-mu block mb-1">
                  Assign Department
                </label>
                <select className="w-full rounded-xl border border-bd bg-card px-3 py-2 text-[13px] text-tx">
                  <option value="Engineering">Engineering</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Management">Management</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-bd/60">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="rounded-full px-4 py-2 text-[13px] font-semibold text-mu hover:bg-so/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#0d3a23] dark:bg-[#155a37] px-5 py-2 text-[13px] font-bold text-white shadow-xs hover:opacity-95"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
