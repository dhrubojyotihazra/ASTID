'use client';
import { ReactNode, useEffect } from 'react';
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

  useEffect(() => {
    if (a.ready && !a.role) router.replace('/login');
  }, [a.ready, a.role, router]);

  if (!a.ready || !a.role) return null;
  const me = ROLES[a.role];
  const openEsc = a.cases.filter(c => c.kind === 'escalate' && !c.res).length;
  const bellOn = a.role === 'senior' && openEsc > 0;

  const navItemClass = (on: boolean) =>
    `flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-left text-[13.5px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac ${
      on
        ? 'bg-so font-semibold text-ac border border-ac/20 shadow-xs'
        : 'text-mu hover:bg-so/60 hover:text-tx'
    }`;

  return (
    <div className="flex min-h-screen flex-wrap gap-5 p-5">
      <aside className="flex min-h-[860px] w-[240px] flex-none flex-col gap-1 rounded-3xl border border-bd bg-card p-[18px]">
        <div className="flex items-center gap-3 px-2 pb-5 border-b border-bd/60 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-so text-ac border border-ac/25">
            <ShieldCheck size={24} />
          </div>
          <div>
            <b className="text-[15px] font-bold tracking-tight text-tx">RiskOps</b>
            <div className="text-[11.5px] font-medium text-mu">Bank Operations</div>
          </div>
        </div>

        <nav aria-label="Main Navigation" className="flex flex-col gap-1 w-full flex-1">
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
            className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-left text-[13.5px] font-medium text-mu transition hover:bg-rb/40 hover:text-rd focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rd"
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-[999_1_560px] flex-col gap-[18px]">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-bd/60 bg-card/60 px-4 py-3 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-ac font-bold text-on shadow-xs text-[13px]"
            >
              {me.label
                .split(' ')
                .map(w => w[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div>
              <div className="text-[13.5px] font-semibold text-tx leading-tight">{me.name}</div>
              <div className="text-[12px] text-mu">
                {me.label} · <span className="font-medium text-tx/80">{me.branch}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {canSeeHealth(a.role) && (
              <span
                aria-label="System status"
                className="num inline-flex items-center gap-1.5 rounded-full bg-so px-3 py-1.5 text-[11.5px] font-semibold text-ac border border-ac/20"
              >
                <span className="h-2 w-2 rounded-full bg-ac animate-pulse" />
                Live System · 6,362,620 records
              </span>
            )}
            <button
              onClick={() => a.setDark(!a.dark)}
              aria-label={a.dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-10 items-center gap-2 rounded-full border border-bd bg-card px-3.5 text-[12.5px] font-semibold text-tx transition hover:border-ac/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac cursor-pointer"
            >
              {a.dark ? <Sun size={15} /> : <Moon size={15} />}
              <span>{a.dark ? 'Light' : 'Dark'}</span>
            </button>
            <button
              aria-label="Notifications"
              onClick={() =>
                a.role === 'senior' ? router.push('/dashboard/esc') : a.say('No new notifications')
              }
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-bd bg-card text-mu hover:text-tx transition hover:border-ac/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac cursor-pointer"
            >
              <Bell size={18} />
              {bellOn && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rd animate-pulse" />}
            </button>
          </div>
        </header>

        {a.toast && (
          <div
            role="status"
            aria-live="polite"
            className="anim-sl fixed right-7 top-6 z-50 flex items-center gap-2.5 rounded-2xl bg-ac px-5 py-3.5 text-[13.5px] font-semibold text-on shadow-lg"
          >
            <span>{a.toast}</span>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
