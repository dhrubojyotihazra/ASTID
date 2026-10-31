'use client';
import { useState } from 'react';
import { Plus, MessageSquare, User, Check, Send, ChevronRight, Shield, Award, Users } from 'lucide-react';
import { useApp } from '@/lib/store';
import { ROLES } from '@/lib/roles';

export type TeamMember = {
  id: string;
  name: string;
  roleTitle: string;
  tier: 'lead' | 'senior' | 'analyst' | 'compliance';
  dept: 'Operations' | 'Escalation' | 'Investigation' | 'Compliance';
  branch: string;
  status: 'online' | 'away' | 'offline';
  activeCases: number;
  resolvedCases: number;
  caseload: number;
  init: string;
  avatarBg: string;
  reportsTo?: string;
};

const MEMBERS: TeamMember[] = [
  {
    id: 'lead-1',
    name: 'Demo Lead',
    roleTitle: 'Risk Operations Lead',
    tier: 'lead',
    dept: 'Operations',
    branch: 'All 5 branches',
    status: 'online',
    activeCases: 0,
    resolvedCases: 48,
    caseload: 64,
    init: 'DL',
    avatarBg: '#fed7aa',
  },
  {
    id: 'sen-1',
    name: 'Demo Senior',
    roleTitle: 'Senior Escalation Lead',
    tier: 'senior',
    dept: 'Escalation',
    branch: 'Multi-branch cluster',
    status: 'online',
    activeCases: 3,
    resolvedCases: 42,
    caseload: 78,
    init: 'DS',
    avatarBg: '#fbcfe8',
    reportsTo: 'lead-1',
  },
  {
    id: 'sen-2',
    name: 'Priya Raman',
    roleTitle: 'Senior Fraud Analyst',
    tier: 'senior',
    dept: 'Escalation',
    branch: 'Mumbai & Pune cluster',
    status: 'online',
    activeCases: 2,
    resolvedCases: 39,
    caseload: 72,
    init: 'PR',
    avatarBg: '#bae6fd',
    reportsTo: 'lead-1',
  },
  {
    id: 'ana-1',
    name: 'Noah Castell',
    roleTitle: 'Branch Analyst',
    tier: 'analyst',
    dept: 'Investigation',
    branch: 'Kolkata-SaltLake',
    status: 'online',
    activeCases: 4,
    resolvedCases: 48,
    caseload: 64,
    init: 'NC',
    avatarBg: '#fed7aa',
    reportsTo: 'sen-1',
  },
  {
    id: 'ana-2',
    name: 'Mateo Silva',
    roleTitle: 'Branch Analyst',
    tier: 'analyst',
    dept: 'Investigation',
    branch: 'Mumbai-BKC',
    status: 'online',
    activeCases: 5,
    resolvedCases: 51,
    caseload: 88,
    init: 'MS',
    avatarBg: '#bbf7d0',
    reportsTo: 'sen-2',
  },
  {
    id: 'ana-3',
    name: 'Hana Kobayashi',
    roleTitle: 'Branch Analyst',
    tier: 'analyst',
    dept: 'Investigation',
    branch: 'Bengaluru-HSR',
    status: 'away',
    activeCases: 2,
    resolvedCases: 33,
    caseload: 56,
    init: 'HK',
    avatarBg: '#e9d5ff',
    reportsTo: 'sen-1',
  },
  {
    id: 'ana-4',
    name: 'Owen Mercer',
    roleTitle: 'Branch Analyst',
    tier: 'analyst',
    dept: 'Investigation',
    branch: 'Delhi-Connaught',
    status: 'online',
    activeCases: 4,
    resolvedCases: 42,
    caseload: 79,
    init: 'OM',
    avatarBg: '#fef08a',
    reportsTo: 'sen-1',
  },
  {
    id: 'comp-1',
    name: 'Sofia Sato',
    roleTitle: 'Compliance Officer',
    tier: 'compliance',
    dept: 'Compliance',
    branch: 'Central Governance',
    status: 'online',
    activeCases: 1,
    resolvedCases: 27,
    caseload: 41,
    init: 'SS',
    avatarBg: '#fed7aa',
    reportsTo: 'lead-1',
  },
  {
    id: 'comp-2',
    name: 'Nadia Bello',
    roleTitle: 'Audit Specialist',
    tier: 'compliance',
    dept: 'Compliance',
    branch: 'Central Governance',
    status: 'offline',
    activeCases: 0,
    resolvedCases: 19,
    caseload: 35,
    init: 'NB',
    avatarBg: '#fef08a',
    reportsTo: 'lead-1',
  },
];

export default function TeamView() {
  const { say, role } = useApp();
  const [viewMode, setViewMode] = useState<'hierarchy' | 'grid'>('hierarchy');
  const [deptFilter, setDeptFilter] = useState<'all' | 'Investigation' | 'Escalation' | 'Compliance' | 'Operations'>('all');
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
    say(`Direct note dispatched to ${name}`);
  };

  // Hierarchy Data Builders
  const leadMember = MEMBERS.find(m => m.tier === 'lead');
  const seniorMembers = MEMBERS.filter(m => m.tier === 'senior');
  const analystMembers = MEMBERS.filter(m => m.tier === 'analyst');
  const complianceMembers = MEMBERS.filter(m => m.tier === 'compliance');

  // Role-specific hierarchy contextualization
  const getHierarchyHeader = () => {
    if (role === 'analyst') {
      return {
        title: 'Your Reporting Line & Supervisory Chain',
        desc: 'Direct supervisors and escalation leads handling high-severity cases for your branch.',
      };
    } else if (role === 'senior') {
      return {
        title: 'Your Escalation Team & Supervised Analysts',
        desc: 'Branch analysts routing cases to you, and your supervisory line under the Risk Operations Lead.',
      };
    } else if (role === 'lead') {
      return {
        title: 'Risk Operations Team Structure',
        desc: 'Complete organizational hierarchy across all branches, escalation tiers, and compliance lines.',
      };
    }
    return {
      title: 'Platform Role Directory & Governance Chain',
      desc: 'System-wide access matrix, hub assignments, and reporting hierarchy.',
    };
  };

  const hierarchyMeta = getHierarchyHeader();

  const renderMemberCard = (m: TeamMember) => (
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
      <p className="text-[12px] text-mu mt-0.5">{m.roleTitle}</p>

      {/* Branch & Dept tag */}
      <div className="my-2.5 flex flex-wrap justify-center gap-1.5">
        <span className="inline-block rounded-full bg-so/70 px-2.5 py-0.5 text-[10.5px] font-semibold text-ac border border-ac/15">
          {m.dept}
        </span>
        <span className="inline-block rounded-full bg-so/40 px-2 py-0.5 text-[10.5px] font-medium text-mu border border-bd/40">
          {m.branch}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 border-y border-bd/50 py-2.5 text-[12px]">
        <div>
          <b className="num block text-[15px] font-extrabold text-tx">{m.activeCases}</b>
          <span className="text-[11px] text-mu">Active Cases</span>
        </div>
        <div>
          <b className="num block text-[15px] font-extrabold text-tx">{m.resolvedCases}</b>
          <span className="text-[11px] text-mu">Resolved</span>
        </div>
      </div>

      {/* Caseload Progress Bar */}
      <div className="my-3 text-left">
        <div className="flex justify-between text-[11.5px] font-semibold text-mu mb-1">
          <span>Caseload</span>
          <span className="num font-bold text-tx">{m.caseload}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-so">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${m.caseload}%`,
              backgroundColor:
                m.caseload > 80 ? '#b45309' : m.caseload > 60 ? '#155a37' : '#5dbd8b',
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
  );

  return (
    <div className="flex flex-col gap-5 page-transition">
      {/* Board Head matching Sentinel layout */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-tx leading-tight">Team</h1>
          <p className="text-[13.5px] text-mu mt-0.5">
            Operational hierarchy, assigned branches, and active investigator workloads.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Toggle between Hierarchy view and Directory grid */}
          <div className="inline-flex rounded-full bg-card border border-bd/80 p-1 shadow-xs">
            <button
              onClick={() => setViewMode('hierarchy')}
              className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition cursor-pointer ${
                viewMode === 'hierarchy'
                  ? 'bg-[#0d3a23] text-white shadow-xs'
                  : 'text-mu hover:text-tx'
              }`}
            >
              Hierarchy View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#0d3a23] text-white shadow-xs'
                  : 'text-mu hover:text-tx'
              }`}
            >
              All Members
            </button>
          </div>

          <button
            onClick={() => setInviteModalOpen(true)}
            className="flex min-h-[42px] items-center gap-2 rounded-full bg-[#0d3a23] dark:bg-[#155a37] px-5 text-[13.5px] font-bold text-white shadow-sm hover:opacity-95 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <Plus size={16} />
            <span>Invite Investigator</span>
          </button>
        </div>
      </div>

      {/* Hierarchy View Mode */}
      {viewMode === 'hierarchy' && (
        <div className="flex flex-col gap-6">
          {/* Hierarchy Banner */}
          <div className="rounded-[24px] border border-bd/80 bg-so/20 p-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-ac animate-pulse" />
                <h2 className="text-[15px] font-bold text-tx">{hierarchyMeta.title}</h2>
              </div>
              <p className="text-[12.5px] text-mu mt-0.5">{hierarchyMeta.desc}</p>
            </div>
            <div className="text-[12px] font-semibold text-mu">
              <span>{onlineCount} investigators online now</span>
            </div>
          </div>

          {/* Level 1: Team Lead Tier */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-mu">
              <Award size={14} className="text-ac" />
              <span>Operations Leadership</span>
            </div>
            {leadMember && (
              <div className="max-w-md">
                {renderMemberCard(leadMember)}
              </div>
            )}
          </div>

          {/* Level 2: Senior Escalation Leads */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-mu">
              <Shield size={14} className="text-am" />
              <span>Senior Escalation Leads (15m SLA Tier)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {seniorMembers.map(m => renderMemberCard(m))}
            </div>
          </div>

          {/* Level 3: Branch Analysts (Grouped by Branch Hub) */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-mu">
              <Users size={14} className="text-tx" />
              <span>Branch Triage Analysts (Frontline Scope)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {analystMembers.map(m => renderMemberCard(m))}
            </div>
          </div>

          {/* Level 4: Compliance & Audit */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-mu">
              <Check size={14} className="text-mu" />
              <span>Compliance &amp; Independent Audit</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {complianceMembers.map(m => renderMemberCard(m))}
            </div>
          </div>
        </div>
      )}

      {/* Grid Directory View Mode */}
      {viewMode === 'grid' && (
        <>
          {/* Department Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-full bg-card border border-bd/80 p-1 shadow-xs">
              {(
                [
                  ['all', 'All Staff'],
                  ['Investigation', 'Investigation'],
                  ['Escalation', 'Escalation'],
                  ['Compliance', 'Compliance'],
                  ['Operations', 'Operations'],
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

          {/* Member Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {filtered.map(m => renderMemberCard(m))}
          </div>
        </>
      )}

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
                    Direct Note to {activeMessageTarget.name}
                  </h3>
                  <div className="text-[11.5px] text-mu">{activeMessageTarget.roleTitle} · {activeMessageTarget.branch}</div>
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
                placeholder={`Dispatch confidential case note to ${activeMessageTarget.name}...`}
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
                  <span>Send Note</span>
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
                    {selectedProfile.roleTitle} · {selectedProfile.dept} ({selectedProfile.branch})
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
                <span className="text-[11.5px] text-mu block">Active Cases</span>
                <b className="num text-[18px] font-extrabold text-tx">{selectedProfile.activeCases}</b>
              </div>
              <div className="rounded-2xl bg-so/30 p-3 border border-bd/40">
                <span className="text-[11.5px] text-mu block">Resolved</span>
                <b className="num text-[18px] font-extrabold text-tx">{selectedProfile.resolvedCases}</b>
              </div>
              <div className="rounded-2xl bg-so/30 p-3 border border-bd/40">
                <span className="text-[11.5px] text-mu block">Caseload</span>
                <b className="num text-[18px] font-extrabold text-tx">{selectedProfile.caseload}%</b>
              </div>
            </div>

            <div className="text-[13px] text-tx/85 bg-so/20 rounded-2xl p-4 border border-bd/40">
              <b>Operational Responsibility:</b> Frontline transaction inspection, suspicious activity report validation, and collaboration across assigned branch clusters with 100% SLA resolution compliance.
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
              <h2 className="text-[17px] font-bold text-tx">Invite Fraud Investigator</h2>
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
                  Investigator Official Email
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="e.g. analyst@riskops.bank.in"
                  className="w-full rounded-xl border border-bd bg-card px-3.5 py-2.5 text-[13.5px] text-tx focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac"
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-mu block mb-1">
                  Assign Department
                </label>
                <select className="w-full rounded-xl border border-bd bg-card px-3 py-2 text-[13px] text-tx">
                  <option value="Investigation">Investigation (Branch Triage)</option>
                  <option value="Escalation">Escalation (Senior SLA Tier)</option>
                  <option value="Compliance">Compliance &amp; Governance</option>
                  <option value="Operations">Operations Management</option>
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
