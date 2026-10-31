'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Upload,
  ArrowUpRight,
  TrendingUp,
  Video,
  Play,
  Pause,
  Square,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { ROLES } from '@/lib/roles';
import { SYSTEM_METRICS, BRANCHES } from '@/lib/data';
import { inrCr } from '@/lib/export';

export default function PrimaryDashboard() {
  const { say, role, cases } = useApp();
  const me = role ? ROLES[role] : { name: 'Noah Castell', label: 'Branch Analyst', branch: 'Kolkata-SaltLake' };

  // Meeting State
  const [inMeeting, setInMeeting] = useState(false);

  // Time Tracker State
  const [seconds, setSeconds] = useState(5049); // 01:24:09
  const [isRunning, setIsRunning] = useState(true);

  // Decile bar hover
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  // New Project modal
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [projectsList, setProjectsList] = useState([
    { name: 'Payments API v2', due: 'Oct 8, 2026', type: 'api' },
    { name: 'Mobile Onboarding', due: 'Oct 12, 2026', type: 'flow' },
    { name: 'Design System Audit', due: 'Oct 15, 2026', type: 'dash' },
    { name: 'Search Revamp', due: 'Oct 20, 2026', type: 'speed' },
    { name: 'Q4 Launch Site', due: 'Oct 22, 2026', type: 'brand' },
    { name: 'Settlement Batch Engine', due: 'Nov 14, 2026', type: 'secure' },
  ]);

  // Timer tick effect
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTimer = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
      .toString()
      .padStart(2, '0')}`;
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setProjectsList(prev => [
      { name: newProjectName.trim(), due: 'Nov 28, 2026', type: 'flow' },
      ...prev,
    ]);
    setNewProjectName('');
    setProjectModalOpen(false);
    say('Added new project successfully');
  };

  return (
    <div className="flex flex-col gap-5 page-transition">
      {/* Board Head matching Screen 1 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-tx leading-tight">
            Dashboard
          </h1>
          <p className="text-[13.5px] text-mu mt-0.5">
            Everything your team is shipping, in one calm place.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setProjectModalOpen(true)}
            className="flex min-h-[42px] items-center gap-2 rounded-full bg-[#0d3a23] dark:bg-[#155a37] px-5 text-[13.5px] font-bold text-white shadow-sm hover:opacity-95 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Project</span>
          </button>
          <label className="flex min-h-[42px] items-center gap-2 rounded-full border border-bd bg-card px-4 text-[13px] font-semibold text-tx shadow-xs hover:bg-so/40 active:scale-95 transition-all duration-200 cursor-pointer">
            <Upload size={15} />
            <span>Import Data</span>
            <input
              type="file"
              accept=".csv"
              className="sr-only"
              onChange={() => say('Data import received. Processing records...')}
            />
          </label>
        </div>
      </div>

      {/* Top 4 Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Total Projects (stat--hero) */}
        <article className="stat--hero rounded-[26px] p-5 shadow-lg flex flex-col justify-between min-h-[145px] transition-transform duration-200 hover:-translate-y-0.5">
          <div className="relative z-10 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-white/90">Total Projects</h2>
            <Link
              href="/dashboard/analytics"
              aria-label="Open analytics"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#0d3a23] shadow-xs transition-transform duration-200 hover:rotate-45"
            >
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="relative z-10 mt-2">
            <div className="num text-[36px] font-extrabold tracking-tight text-white leading-none">
              25
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11.5px] font-medium text-white/80">
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10.5px] font-bold">5 ^</span>
              <span>Increased from last month</span>
            </div>
          </div>
        </article>

        {/* Card 2: Ended Projects */}
        <article className="rounded-[26px] border border-bd/80 bg-card p-5 shadow-xs flex flex-col justify-between min-h-[145px] interactive-hover">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-mu">Ended Projects</h2>
            <button
              aria-label="View ended projects"
              onClick={() => say('Filtering ended projects')}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-bd bg-card text-mu shadow-2xs hover:text-tx hover:rotate-45 transition-all duration-200"
            >
              <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="mt-2">
            <div className="num text-[36px] font-extrabold tracking-tight text-tx leading-none">
              10
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11.5px] font-medium text-mu">
              <span className="rounded-full bg-so px-2 py-0.5 text-[10.5px] font-bold text-ac">6 ^</span>
              <span>Increased from last month</span>
            </div>
          </div>
        </article>

        {/* Card 3: Running Projects */}
        <article className="rounded-[26px] border border-bd/80 bg-card p-5 shadow-xs flex flex-col justify-between min-h-[145px] interactive-hover">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-mu">Running Projects</h2>
            <button
              aria-label="View running projects"
              onClick={() => say('Filtering running projects')}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-bd bg-card text-mu shadow-2xs hover:text-tx hover:rotate-45 transition-all duration-200"
            >
              <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="mt-2">
            <div className="num text-[36px] font-extrabold tracking-tight text-tx leading-none">
              12
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11.5px] font-medium text-mu">
              <span className="rounded-full bg-so px-2 py-0.5 text-[10.5px] font-bold text-ac">2 ^</span>
              <span>Increased from last month</span>
            </div>
          </div>
        </article>

        {/* Card 4: Pending Projects */}
        <article className="rounded-[26px] border border-bd/80 bg-card p-5 shadow-xs flex flex-col justify-between min-h-[145px] interactive-hover">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-mu">Pending Projects</h2>
            <button
              aria-label="View pending projects"
              onClick={() => say('Filtering pending projects')}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-bd bg-card text-mu shadow-2xs hover:text-tx hover:rotate-45 transition-all duration-200"
            >
              <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="mt-2">
            <div className="num text-[36px] font-extrabold tracking-tight text-tx leading-none">
              3
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11.5px] font-semibold text-am">
              <span>Awaiting review</span>
            </div>
          </div>
        </article>
      </div>

      {/* Middle Grid: Project Analytics (Decile Bars), Reminders, and Projects List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Project Analytics Decile Bars (5 cols) */}
        <div className="lg:col-span-5 rounded-[26px] border border-bd/80 bg-card p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-tx">Project Analytics</h2>
            {hoveredBar && (
              <span className="text-[11.5px] font-bold text-ac rounded-full bg-so px-2.5 py-0.5">
                {hoveredBar}
              </span>
            )}
          </div>

          {/* 7 Bars (Sunday to Saturday) matching Screen 1 */}
          <div className="relative flex items-end justify-between gap-2.5 h-48 pt-8 pb-2">
            {/* Sunday */}
            <div className="flex flex-col items-center flex-1 h-full justify-end gap-2">
              <div
                onMouseEnter={() => setHoveredBar('Sunday: 60% Planned')}
                onMouseLeave={() => setHoveredBar(null)}
                className="bar-pill bar--plan w-full cursor-pointer"
                style={{ height: '60%' }}
              />
              <span className="text-[12px] font-semibold text-mu">S</span>
            </div>

            {/* Monday */}
            <div className="flex flex-col items-center flex-1 h-full justify-end gap-2">
              <div
                onMouseEnter={() => setHoveredBar('Monday: 86% Complete')}
                onMouseLeave={() => setHoveredBar(null)}
                className="bar-pill bar--mid w-full cursor-pointer"
                style={{ height: '86%' }}
              />
              <span className="text-[12px] font-semibold text-mu">M</span>
            </div>

            {/* Tuesday */}
            <div className="flex flex-col items-center flex-1 h-full justify-end gap-2">
              <div
                onMouseEnter={() => setHoveredBar('Tuesday: 74% Complete')}
                onMouseLeave={() => setHoveredBar(null)}
                className="bar-pill bar--light w-full cursor-pointer"
                style={{ height: '74%' }}
              />
              <span className="text-[12px] font-semibold text-mu">T</span>
            </div>

            {/* Wednesday with Plan 95% badge */}
            <div className="relative flex flex-col items-center flex-1 h-full justify-end gap-2">
              <div className="absolute -top-3 whitespace-nowrap rounded-full bg-[#fdf3e2] border border-[#f59f00]/30 px-2 py-0.5 text-[10px] font-bold text-[#b06d0a] shadow-xs">
                Plan 95%
              </div>
              <div
                onMouseEnter={() => setHoveredBar('Wednesday: 96% Complete')}
                onMouseLeave={() => setHoveredBar(null)}
                className="bar-pill bar--dark w-full cursor-pointer"
                style={{ height: '96%' }}
              />
              <span className="text-[12px] font-semibold text-mu">W</span>
            </div>

            {/* Thursday */}
            <div className="flex flex-col items-center flex-1 h-full justify-end gap-2">
              <div
                onMouseEnter={() => setHoveredBar('Thursday: 68% Planned')}
                onMouseLeave={() => setHoveredBar(null)}
                className="bar-pill bar--plan w-full cursor-pointer"
                style={{ height: '68%' }}
              />
              <span className="text-[12px] font-semibold text-mu">T</span>
            </div>

            {/* Friday */}
            <div className="flex flex-col items-center flex-1 h-full justify-end gap-2">
              <div
                onMouseEnter={() => setHoveredBar('Friday: 55% Planned')}
                onMouseLeave={() => setHoveredBar(null)}
                className="bar-pill bar--plan w-full cursor-pointer"
                style={{ height: '55%' }}
              />
              <span className="text-[12px] font-semibold text-mu">F</span>
            </div>

            {/* Saturday */}
            <div className="flex flex-col items-center flex-1 h-full justify-end gap-2">
              <div
                onMouseEnter={() => setHoveredBar('Saturday: 45% Planned')}
                onMouseLeave={() => setHoveredBar(null)}
                className="bar-pill bar--plan w-full cursor-pointer"
                style={{ height: '45%' }}
              />
              <span className="text-[12px] font-semibold text-mu">S</span>
            </div>
          </div>
        </div>

        {/* Reminders Card (3 cols) */}
        <div className="lg:col-span-3 rounded-[26px] border border-bd/80 bg-card p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-tx">Reminders</h2>
            <div className="mt-4">
              <h3 className="text-[15px] font-extrabold text-[#0d3a23] dark:text-[#5dbd8b] leading-snug">
                Check-in with Halcyon Labs
              </h3>
              <p className="text-[12.5px] text-mu mt-1">Time : 02.00 pm - 04.00 pm</p>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={() => {
                setInMeeting(!inMeeting);
                say(inMeeting ? 'Meeting concluded' : 'Joined Halcyon Labs conference');
              }}
              className={`w-full flex min-h-[42px] items-center justify-center gap-2 rounded-full px-4 text-[13px] font-bold shadow-xs transition-all duration-200 cursor-pointer ${
                inMeeting
                  ? 'bg-rd text-white hover:opacity-95'
                  : 'bg-[#0d3a23] dark:bg-[#155a37] text-white hover:opacity-95'
              }`}
            >
              {inMeeting ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  <span>In Meeting · Leave</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-[#5dbd8b]" />
                  <Video size={15} />
                  <span>Start Meeting</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Projects List Card (4 cols) */}
        <div className="lg:col-span-4 rounded-[26px] border border-bd/80 bg-card p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-bd/50">
            <h2 className="text-[16px] font-bold text-tx">Project</h2>
            <button
              onClick={() => setProjectModalOpen(true)}
              className="flex items-center gap-1 rounded-full border border-bd bg-so/30 px-2.5 py-1 text-[11.5px] font-semibold text-tx hover:bg-so/60 transition cursor-pointer"
            >
              <Plus size={12} />
              <span>New</span>
            </button>
          </div>

          {/* Project List Items with pure CSS icons */}
          <div className="flex flex-col divide-y divide-bd/40 overflow-y-auto max-h-[220px]">
            {projectsList.map((p, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 first:pt-2 last:pb-0">
                <span className={`pico pico--${p.type}`} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold text-tx">{p.name}</div>
                  <div className="text-[11px] text-mu">Due date: {p.due}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Team Collaboration, Project Progress Semicircle, and Time Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Team Collaboration List (5 cols) */}
        <div className="lg:col-span-5 rounded-[26px] border border-bd/80 bg-card p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-bd/50">
            <h2 className="text-[16px] font-bold text-tx">Team Collaboration</h2>
            <Link
              href="/dashboard/team"
              className="flex items-center gap-1 rounded-full border border-bd bg-so/30 px-2.5 py-1 text-[11.5px] font-semibold text-tx hover:bg-so/60 transition cursor-pointer"
            >
              <Plus size={12} />
              <span>Add Member</span>
            </Link>
          </div>

          <div className="flex flex-col divide-y divide-bd/40 my-auto py-1">
            {[
              {
                name: 'Priya Raman',
                init: 'PR',
                bg: '#fbcfe8',
                work: 'Design System Tokens',
                status: 'Completed',
                statusClass: 'bg-so text-ac border border-ac/20',
              },
              {
                name: 'Mateo Silva',
                init: 'MS',
                bg: '#bbf7d0',
                work: 'Passkey Sign-in',
                status: 'In Progress',
                statusClass: 'bg-ab text-am border border-am/20',
              },
              {
                name: 'Hana Kobayashi',
                init: 'HK',
                bg: '#e9d5ff',
                work: 'Saved Filters for Projects',
                status: 'Pending',
                statusClass: 'bg-rb text-rd border border-rd/20',
              },
              {
                name: 'Owen Mercer',
                init: 'OM',
                bg: '#fef08a',
                work: 'Marketing Site Refresh',
                status: 'In Progress',
                statusClass: 'bg-ab text-am border border-am/20',
              },
            ].map((m, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-tx shadow-2xs"
                    style={{ backgroundColor: m.bg }}
                  >
                    {m.init}
                  </div>
                  <div className="truncate">
                    <div className="text-[13px] font-bold text-tx leading-snug">{m.name}</div>
                    <div className="text-[11px] text-mu truncate">
                      Working on <b className="text-tx font-medium">{m.work}</b>
                    </div>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${m.statusClass}`}>
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Project Progress Gauge (3 cols) */}
        <div className="lg:col-span-3 rounded-[26px] border border-bd/80 bg-card p-6 shadow-xs flex flex-col justify-between text-center">
          <h2 className="text-[16px] font-bold text-tx text-left">Project Progress</h2>

          {/* Semicircle SVG Arc Gauge */}
          <div className="relative flex flex-col items-center justify-center my-auto py-2">
            <svg viewBox="0 0 240 130" className="w-48 h-auto overflow-visible">
              <defs>
                <pattern id="hatch-pattern" width="6" height="6" patternUnits="userSpaceOnUse">
                  <path d="M-1,1 l2,-2 M0,6 l6,-6 M5,7 l2,-2" stroke="#8d9a92" strokeWidth="1.5" />
                </pattern>
              </defs>

              {/* Background Track */}
              <path
                d="M30 115 A 85 85 0 0 1 210 115"
                fill="none"
                stroke="#e3e7e4"
                strokeWidth="20"
                strokeLinecap="round"
              />

              {/* Completed Segment (40%) */}
              <path
                d="M30 115 A 85 85 0 0 1 210 115"
                fill="none"
                stroke="#1d7347"
                strokeWidth="20"
                strokeDasharray="106 267"
                strokeDashoffset="0"
              />

              {/* In Progress Segment (35%) */}
              <path
                d="M30 115 A 85 85 0 0 1 210 115"
                fill="none"
                stroke="#0d3a23"
                strokeWidth="20"
                strokeDasharray="93 267"
                strokeDashoffset="-106"
              />

              {/* Pending Segment (Hatched pattern 25%) */}
              <path
                d="M30 115 A 85 85 0 0 1 210 115"
                fill="none"
                stroke="url(#hatch-pattern)"
                strokeWidth="20"
                strokeDasharray="68 267"
                strokeDashoffset="-199"
              />
            </svg>

            {/* Gauge Label */}
            <div className="mt-2 text-center">
              <div className="num text-[26px] font-extrabold text-tx leading-tight">40%</div>
              <div className="text-[11.5px] font-medium text-mu">Project Ended</div>
            </div>
          </div>

          {/* Legend dots */}
          <div className="flex items-center justify-center gap-3 text-[11px] font-semibold text-mu pt-2 border-t border-bd/40">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#1d7347]" />
              <span>Completed</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#0d3a23]" />
              <span>In Progress</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#8d9a92]" />
              <span>Pending</span>
            </span>
          </div>
        </div>

        {/* Time Tracker Card (4 cols) */}
        <div className="time-tracker-card lg:col-span-4 rounded-[26px] p-6 shadow-md text-white flex flex-col justify-between">
          <div className="relative z-10 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-white/90">Time Tracker</h2>
            <div className="flex items-center gap-1 text-[11px] text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5dbd8b] animate-ping" />
              <span>Live</span>
            </div>
          </div>

          {/* Digital Timer Display */}
          <div className="relative z-10 my-auto text-center py-4">
            <div className="num text-[40px] font-extrabold tracking-wider text-white">
              {formatTimer(seconds)}
            </div>
            <div className="text-[12px] text-white/70 mt-1">Current Active Stream</div>
          </div>

          {/* Timer Controls */}
          <div className="relative z-10 flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              aria-label={isRunning ? 'Pause timer' : 'Start timer'}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0d3a23] shadow-md hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              {isRunning ? <Pause size={18} /> : <Play size={18} className="translate-x-0.5" />}
            </button>
            <button
              onClick={() => {
                setIsRunning(false);
                setSeconds(0);
                say('Time session logged and committed');
              }}
              aria-label="Stop timer"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-rd text-white shadow-md hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              <Square size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Add Project Modal */}
      {projectModalOpen && (
        <div
          onClick={() => setProjectModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1811]/50 backdrop-blur-xs p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="anim-dlg w-full max-w-md rounded-[26px] border border-bd bg-card p-6 shadow-2xl flex flex-col gap-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-bd/60">
              <h2 className="text-[17px] font-bold text-tx">Create New Project</h2>
              <button
                onClick={() => setProjectModalOpen(false)}
                className="text-mu hover:text-tx text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
              <div>
                <label className="text-[12px] font-semibold text-mu block mb-1">
                  Project Title
                </label>
                <input
                  required
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  placeholder="e.g. Real-Time Settlement Engine"
                  className="w-full rounded-xl border border-bd bg-card px-3.5 py-2.5 text-[13.5px] text-tx focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-bd/60">
                <button
                  type="button"
                  onClick={() => setProjectModalOpen(false)}
                  className="rounded-full px-4 py-2 text-[13px] font-semibold text-mu hover:bg-so/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#0d3a23] dark:bg-[#155a37] px-5 py-2 text-[13px] font-bold text-white shadow-xs hover:opacity-95"
                >
                  Add Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
