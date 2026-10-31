'use client';
import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Building2,
  Clock,
  Home,
  LogOut,
  ListChecks,
  Moon,
  Search,
  Settings,
  SlidersHorizontal,
  ShieldCheck,
  Sun,
  Upload,
  Users,
  BarChart3,
  Menu,
  X,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { ROLES, canSeeHealth } from '@/lib/roles';

const ICONS: Record<string, any> = {
  home: Home,
  queue: ListChecks,
  search: Search,
  users: Users,
  clock: Clock,
  building: Building2,
  chart: BarChart3,
  sliders: SlidersHorizontal,
  upload: Upload,
};

export default function Shell({ children }: { children: ReactNode }) {
  const a = useApp();
  const path = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (a.ready && !a.role) router.replace('/login');
  }, [a.ready, a.role, router]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [path]);

  // Handle Escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileNavOpen) {
        setMobileNavOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileNavOpen]);

  if (!a.ready || !a.role) return null;
  const me = ROLES[a.role];
  const openEsc = a.cases.filter(c => c.kind === 'escalate' && !c.res).length;
  const bellOn = a.role === 'senior' && openEsc > 0;

  const navItemClass = (on: boolean) =>
    `flex min-h-[44px] w-full items-center gap-3 rounded-2xl px-3.5 text-left text-[13.5px] font-semibold transition-all duration-200 ease-[cubic-bezier(.22,1,.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac ${
      on
        ? 'bg-so text-ac border border-ac/20 shadow-xs'
        : 'text-mu hover:translate-x-1.5 hover:bg-so/60 hover:text-tx'
    }`;

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-2 pb-5 border-b border-bd/60 mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-so text-ac border border-ac/25 shadow-xs">
            <ShieldCheck size={24} />
          </div>
          <div>
            <b className="text-[16px] font-bold tracking-tight text-tx">RiskOps</b>
            <div className="text-[11.5px] font-medium text-mu">Bank Operations</div>
          </div>
        </div>
        {/* Mobile close button */}
        <button
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close sidebar navigation"
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-full border border-bd text-mu hover:text-tx transition-all duration-200 active:scale-95"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav Links */}
      <nav aria-label="Main Navigation" className="flex flex-col gap-1 w-full flex-1 overflow-y-auto">
        {me.tabs.map(t => {
          const I = ICONS[t.icon];
          const on = path === '/dashboard/' + t.key;
          return (
            <Link
              key={t.key}
              href={'/dashboard/' + t.key}
              aria-current={on ? 'page' : undefined}
              className={navItemClass(on)}
            >
              <I size={18} className={on ? 'text-ac' : 'text-mu'} />
              <span>{t.label}</span>
              {t.key === 'esc' && openEsc > 0 && (
                <span className="num ml-auto rounded-full bg-rb px-2 py-0.5 text-[11px] font-bold text-rd">
                  {openEsc}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Utilities */}
      <div className="flex flex-col gap-1 pt-3 border-t border-bd/60 mt-auto">
        <Link
          href="/dashboard/settings"
          aria-current={path === '/dashboard/settings' ? 'page' : undefined}
          className={navItemClass(path === '/dashboard/settings')}
        >
          <Settings size={18} />
          <span>Settings</span>
        </Link>
        <button
          onClick={() => {
            a.signOut();
            router.push('/login');
          }}
          aria-label="Sign out of workbench"
          className="flex min-h-[44px] w-full items-center gap-3 rounded-2xl px-3.5 text-left text-[13.5px] font-semibold text-mu transition-all duration-200 ease-[cubic-bezier(.22,1,.36,1)] hover:translate-x-1 hover:bg-rb/40 hover:text-rd focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rd active:scale-95 cursor-pointer"
        >
          <LogOut size={18} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col lg:flex-row gap-3.5 p-3.5 md:p-5 max-w-[1720px] mx-auto">
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
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-[290px] max-w-[84vw] bg-card p-5 border-r border-bd shadow-2xl transition-transform duration-450 ease-[cubic-bezier(.22,1,.36,1)] ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:flex min-h-[860px] w-[240px] flex-none flex-col rounded-[26px] border border-bd bg-card p-5 sticky top-5 h-[calc(100vh-40px)] shadow-xs">
        {sidebarContent}
      </aside>

      {/* Main Content Area */}
      <main className="flex min-w-0 flex-1 flex-col gap-4">
        {/* Top Header Bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-bd/80 bg-card/80 px-4 py-3 backdrop-blur-md shadow-xs">
          <div className="flex items-center gap-3">
            {/* Hamburger button on mobile/tablet */}
            <button
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-full border border-bd bg-card text-tx transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <Menu size={19} />
            </button>

            <div
              aria-hidden="true"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-ac font-bold text-on shadow-xs text-[13px] transition-transform hover:scale-105"
            >
              {me.label
                .split(' ')
                .map(w => w[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div>
              <div className="text-[13.5px] font-bold text-tx leading-tight tracking-tight">
                {me.name}
              </div>
              <div className="text-[12px] text-mu">
                {me.label} · <span className="font-semibold text-tx/85">{me.branch}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {canSeeHealth(a.role) && (
              <span
                aria-label="System status"
                className="num hidden sm:inline-flex items-center gap-1.5 rounded-full bg-so px-3 py-1.5 text-[11.5px] font-semibold text-ac border border-ac/20"
              >
                <span className="h-2 w-2 rounded-full bg-ac animate-pulse" />
                Live System · 6,362,620 records
              </span>
            )}
            <button
              onClick={() => a.setDark(!a.dark)}
              aria-label={a.dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-10 items-center gap-2 rounded-full border border-bd bg-card px-3.5 text-[12.5px] font-semibold text-tx transition-all duration-200 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-0.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac cursor-pointer"
            >
              {a.dark ? <Sun size={15} /> : <Moon size={15} />}
              <span className="hidden sm:inline">{a.dark ? 'Light' : 'Dark'}</span>
            </button>
            <button
              aria-label="Notifications"
              onClick={() =>
                a.role === 'senior' ? router.push('/dashboard/esc') : a.say('No new notifications')
              }
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-bd bg-card text-mu hover:text-tx transition-all duration-200 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-0.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac cursor-pointer"
            >
              <Bell size={18} />
              {bellOn && (
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rd animate-pulse" />
              )}
            </button>
          </div>
        </header>

        {/* Global Notification Toast with Fernly spring curve */}
        {a.toast && (
          <div
            role="status"
            aria-live="polite"
            className="anim-sl fixed right-5 sm:right-7 top-6 z-50 flex items-center gap-2.5 rounded-2xl bg-ac px-5 py-3.5 text-[13.5px] font-semibold text-on shadow-xl"
          >
            <span>{a.toast}</span>
          </div>
        )}

        {children}
      </main>
    </div>
  );
}
