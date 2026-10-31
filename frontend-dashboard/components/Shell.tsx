'use client';
import { ReactNode, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Building2,
  Calendar,
  Check,
  CheckSquare,
  Clock,
  HelpCircle,
  Home,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Mail,
  Menu,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Upload,
  Users,
  BarChart3,
  X,
  Smartphone,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { ROLES, canSeeHealth } from '@/lib/roles';
import { Role } from '@/lib/data';
import Preloader from './Preloader';

const ICONS: Record<string, any> = {
  home: LayoutDashboard,
  cases: CheckSquare,
  tasks: CheckSquare,
  queue: ListChecks,
  search: Search,
  users: Users,
  clock: Clock,
  building: Building2,
  chart: BarChart3,
  sliders: SlidersHorizontal,
  upload: Upload,
  check: Check,
  calendar: Calendar,
};

export default function Shell({ children }: { children: ReactNode }) {
  const a = useApp();
  const path = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Moving green indicator bar state (matching Image 2)
  const [indicator, setIndicator] = useState({ top: 0, height: 32, opacity: 0 });
  const desktopSidebarRef = useRef<HTMLElement>(null);
  const mobileSidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (a.ready && !a.role) router.replace('/login');
  }, [a.ready, a.role, router]);

  // Keep browser tab title strictly as ASTID
  useEffect(() => {
    document.title = 'ASTID';
  }, [path]);

  // Update sliding green bar position whenever path or role changes
  useEffect(() => {
    const updateIndicator = () => {
      const container = (window.innerWidth >= 1024 ? desktopSidebarRef.current : mobileSidebarRef.current) || desktopSidebarRef.current;
      if (!container) return;
      const activeLink = container.querySelector<HTMLElement>('a[aria-current="page"]');
      if (activeLink) {
        const containerRect = container.getBoundingClientRect();
        const linkRect = activeLink.getBoundingClientRect();
        setIndicator({
          top: linkRect.top - containerRect.top + 5,
          height: linkRect.height - 10,
          opacity: 1,
        });
      } else {
        setIndicator(prev => ({ ...prev, opacity: 0 }));
      }
    };

    updateIndicator();
    const t = setTimeout(updateIndicator, 60);
    window.addEventListener('resize', updateIndicator);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [path, a.role, mobileNavOpen]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [path]);

  // Handle Ctrl+K and / keyboard shortcuts for search, and Escape for dialogs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key.toLowerCase() === 'k') || (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (mobileNavOpen) setMobileNavOpen(false);
        if (roleMenuOpen) setRoleMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileNavOpen, roleMenuOpen]);

  if (!a.ready || !a.role) return null;
  const me = ROLES[a.role];
  const openEsc = a.cases.filter(c => c.kind === 'escalate' && !c.res).length;
  const pendingReview = a.cases.filter(c => c.kind === 'review' && !c.res).length;
  const bellOn = (a.role === 'senior' && openEsc > 0) || (a.role === 'analyst' && pendingReview > 0);

  const navItemClass = (on: boolean) =>
    `flex min-h-[42px] w-full items-center gap-3 rounded-2xl px-3.5 text-left text-[13.5px] font-semibold transition-all duration-200 ease-[cubic-bezier(.22,1,.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac ${
      on
        ? 'bg-so text-ac border border-ac/20 shadow-xs'
        : 'text-mu hover:translate-x-1 hover:bg-so/50 hover:text-tx'
    }`;

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand Header with ASTID Logo & Vector Wordmark */}
      <div className="flex items-center justify-between px-2 pb-5 border-b border-bd/60 mb-3">
        <Link href="/dashboard/home" className="flex items-center gap-2.5 group">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-so/70 dark:bg-so/25 border border-ac/25 p-1 shadow-xs transition-transform duration-200 group-hover:scale-105 flex-shrink-0">
            <Image
              src="/astid-logo-square.png"
              alt="ASTID Logo"
              width={38}
              height={38}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col min-w-0">
            <Image
              src="/astid-wordmark.png"
              alt="astid"
              width={88}
              height={26}
              className="object-contain h-[23px] w-auto transition-transform duration-200 group-hover:scale-105"
              priority
            />
            <span className="block text-[9.5px] uppercase font-bold tracking-widest text-mu mt-0.5 whitespace-nowrap">Fraud Defense</span>
          </div>
        </Link>
        {/* Mobile close button */}
        <button
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close sidebar navigation"
          className="lg:hidden flex h-8 w-8 items-center justify-center rounded-full border border-bd text-mu hover:text-tx transition cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex flex-col gap-4 w-full flex-1 overflow-y-auto pr-1">
        {/* OPERATIONS Section */}
        <div>
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-mu/75">
            Operations
          </div>
          <nav aria-label="Main Navigation" className="flex flex-col gap-1 w-full">
            {me.tabs.map(t => {
              const I = ICONS[t.icon] || LayoutDashboard;
              const on = path === '/dashboard/' + t.key;
              return (
                <Link
                  key={t.key}
                  href={'/dashboard/' + t.key}
                  aria-current={on ? 'page' : undefined}
                  className={navItemClass(on)}
                >
                  <I size={17} className={on ? 'text-ac' : 'text-mu'} />
                  <span>{t.label}</span>
                  {t.key === 'cases' && pendingReview > 0 && (
                    <span className="num ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#0d3a23] px-1.5 text-[11px] font-bold text-white shadow-2xs">
                      {pendingReview}
                    </span>
                  )}
                  {t.key === 'esc' && openEsc > 0 && (
                    <span className="num ml-auto rounded-full bg-rb px-2 py-0.5 text-[11px] font-bold text-rd">
                      {openEsc}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* GENERAL Section */}
        <div className="pt-2">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-mu/75">
            System
          </div>
          <div className="flex flex-col gap-1 w-full">
            <Link
              href="/dashboard/settings"
              aria-current={path === '/dashboard/settings' ? 'page' : undefined}
              className={navItemClass(path === '/dashboard/settings')}
            >
              <Settings size={17} />
              <span>Settings</span>
            </Link>
            <Link
              href="/dashboard/help"
              aria-current={path === '/dashboard/help' ? 'page' : undefined}
              className={navItemClass(path === '/dashboard/help')}
            >
              <HelpCircle size={17} />
              <span>Help Center</span>
            </Link>
            <button
              onClick={() => {
                a.signOut();
                router.push('/login');
              }}
              aria-label="Sign out of workbench"
              className="flex min-h-[42px] w-full items-center gap-3 rounded-2xl px-3.5 text-left text-[13.5px] font-semibold text-mu transition-all duration-200 hover:translate-x-1 hover:bg-rb/40 hover:text-rd active:scale-95 cursor-pointer"
            >
              <LogOut size={17} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom System Operational Status (clean replacement for removed promo card) */}
      <div className="mt-auto pt-4 border-t border-bd/60 flex items-center justify-between text-[11px] text-mu px-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-ac animate-pulse" />
          <span className="font-semibold text-tx">Engine v2.4</span>
        </div>
        <span className="font-mono text-[10.5px] rounded-full bg-so px-2 py-0.5 text-ac font-bold border border-ac/15">
          99.8% SLA
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col lg:flex-row gap-3.5 p-3 md:p-5 max-w-[1720px] mx-auto">
      {/* Branded Preloader on Initial Mount */}
      <Preloader />

      {/* Mobile Backdrop Scrim */}
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 z-40 bg-[#0d1811]/50 backdrop-blur-xs transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-Out Drawer Sidebar */}
      <aside
        ref={mobileSidebarRef}
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-[290px] max-w-[84vw] bg-card p-5 border-r border-bd shadow-2xl transition-transform duration-350 ease-[cubic-bezier(.22,1,.36,1)] relative ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Moving Active Green Bar Indicator */}
        <div
          aria-hidden="true"
          className="absolute left-0 w-[4px] rounded-r-full bg-[#0d3a23] dark:bg-[#5dbd8b] shadow-xs pointer-events-none transition-all duration-350 ease-[cubic-bezier(.22,1,.36,1)]"
          style={{
            top: `${indicator.top}px`,
            height: `${indicator.height}px`,
            opacity: indicator.opacity,
            boxShadow: a.dark ? '0 0 12px 2px rgba(93, 189, 139, 0.45)' : '0 0 10px 1px rgba(13, 58, 35, 0.3)',
          }}
        />
        {sidebarContent}
      </aside>

      {/* Desktop Sticky Sidebar */}
      <aside
        ref={desktopSidebarRef}
        className="hidden lg:flex min-h-[860px] w-[240px] flex-none flex-col rounded-[26px] border border-bd bg-card p-5 sticky top-5 h-[calc(100vh-40px)] shadow-xs relative overflow-hidden"
      >
        {/* Moving Active Green Bar Indicator (matching Image 2) */}
        <div
          aria-hidden="true"
          className="absolute left-0 w-[4.5px] rounded-r-full bg-[#0d3a23] dark:bg-[#5dbd8b] shadow-xs pointer-events-none transition-all duration-350 ease-[cubic-bezier(.22,1,.36,1)]"
          style={{
            top: `${indicator.top}px`,
            height: `${indicator.height}px`,
            opacity: indicator.opacity,
            boxShadow: a.dark ? '0 0 12px 2px rgba(93, 189, 139, 0.45)' : '0 0 10px 1px rgba(13, 58, 35, 0.3)',
          }}
        />
        {sidebarContent}
      </aside>

      {/* Main Content Area */}
      <main className="flex min-w-0 flex-1 flex-col gap-4">
        {/* Top Header Bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-bd/80 bg-card/80 px-4 py-3 backdrop-blur-md shadow-xs">
          {/* Left: Mobile hamburger & Search input with Ctrl+K */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-full border border-bd bg-card text-tx transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <Menu size={19} />
            </button>

            {/* Header Search with Ctrl+K badge */}
            <div className="relative flex items-center w-full">
              <Search size={16} className="absolute left-3.5 text-mu pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search cases, accounts & investigators..."
                className="w-full rounded-full border border-bd/90 bg-card/90 py-2 pl-9 pr-14 text-[13px] text-tx placeholder:text-mu focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac transition"
              />
              <kbd className="absolute right-3 rounded-md border border-bd bg-so/50 px-1.5 py-0.5 text-[10.5px] font-mono font-bold text-mu pointer-events-none">
                Ctrl K
              </kbd>
            </div>
          </div>

          {/* Right: Message Mail icon, Bell icon, User Avatar & Role Switcher */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Mail Icon with alert badge */}
            <button
              onClick={() => a.say('You have 2 unread operational alerts')}
              aria-label="Messages"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-bd bg-card text-mu hover:text-tx transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <Mail size={17} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rd" />
            </button>

            {/* Bell Icon with notification dot */}
            <button
              aria-label="Notifications"
              onClick={() =>
                a.role === 'senior' ? router.push('/dashboard/esc') : a.say(`Operational queue: ${pendingReview} cases pending review`)
              }
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-bd bg-card text-mu hover:text-tx transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <Bell size={17} />
              {bellOn && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rd animate-pulse" />
              )}
            </button>

            {/* Theme Toggle with Wave Transition */}
            <button
              onClick={e => a.toggleTheme(e)}
              aria-label={a.dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-10 items-center gap-1.5 rounded-full border border-bd bg-card px-3 text-[12px] font-semibold text-tx hover:bg-so/40 transition-all duration-200 active:scale-90 cursor-pointer"
            >
              {a.dark ? <Sun size={15} /> : <Moon size={15} />}
              <span className="hidden sm:inline">{a.dark ? 'Light' : 'Dark'}</span>
            </button>

            {/* User Profile Pill & Quick Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2.5 rounded-full border border-bd/80 bg-card p-1 pr-3 hover:bg-so/40 transition active:scale-95 cursor-pointer"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fed7aa] text-[12px] font-extrabold text-tx shadow-2xs">
                  {me.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-[12.5px] font-bold text-tx leading-tight">
                    {me.name}
                  </div>
                  <div className="text-[11px] text-mu leading-tight">{me.label}</div>
                </div>
              </button>

              {/* Role Switcher Menu */}
              {roleMenuOpen && (
                <div
                  onClick={e => e.stopPropagation()}
                  className="anim-dlg absolute right-0 top-12 z-50 flex w-60 flex-col gap-1 rounded-[22px] border border-bd bg-card p-2 shadow-2xl text-[12.5px]"
                >
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-mu">
                    Switch Active Role
                  </div>
                  {(['analyst', 'senior', 'lead', 'admin'] as Role[]).map(r => (
                    <button
                      key={r}
                      onClick={() => {
                        a.signIn(r);
                        setRoleMenuOpen(false);
                        a.say(`Switched view to ${ROLES[r].label}`);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-semibold transition cursor-pointer ${
                        a.role === r
                          ? 'bg-so text-ac border border-ac/20'
                          : 'text-tx hover:bg-so/50'
                      }`}
                    >
                      <div>
                        <div>{ROLES[r].label}</div>
                        <div className="text-[10.5px] font-normal text-mu">{ROLES[r].branch}</div>
                      </div>
                      {a.role === r && <Check size={14} className="text-ac" />}
                    </button>
                  ))}
                  <div className="pt-1.5 mt-1 border-t border-bd/60">
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setRoleMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-mu hover:text-tx hover:bg-so/50 transition"
                    >
                      <Settings size={14} />
                      <span>Account Settings</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Global Notification Toast */}
        {a.toast && (
          <div
            role="status"
            aria-live="polite"
            className="anim-sl fixed right-5 sm:right-7 top-6 z-50 flex items-center gap-2.5 rounded-2xl bg-[#0d3a23] dark:bg-[#155a37] px-5 py-3.5 text-[13.5px] font-semibold text-white shadow-xl"
          >
            <span>{a.toast}</span>
          </div>
        )}

        {/* Render Child Views */}
        {children}
      </main>
    </div>
  );
}
