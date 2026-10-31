'use client';
import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Building2, Clock, Home, LogOut, ListChecks, Moon, Search, Settings, SlidersHorizontal, Sprout, Sun, Upload, Users, BarChart3 } from 'lucide-react';
import { useApp } from '@/lib/store';
import { ROLES, canSeeHealth } from '@/lib/roles';

const ICONS: Record<string, any> = { home: Home, queue: ListChecks, search: Search, users: Users, clock: Clock, building: Building2, chart: BarChart3, sliders: SlidersHorizontal, upload: Upload };

export default function Shell({ children }: { children: ReactNode }) {
  const a = useApp(); const path = usePathname(); const router = useRouter();
  useEffect(() => { if (a.ready && !a.role) router.replace('/login'); }, [a.ready, a.role, router]);
  if (!a.ready || !a.role) return null;
  const me = ROLES[a.role];
  const openEsc = a.cases.filter(c => c.kind === 'escalate' && !c.res).length;
  const bellOn = a.role === 'senior' && openEsc > 0;
  const nav = 'flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-left text-[14px] font-medium transition hover:translate-x-0.5 hover:bg-so hover:text-ac';
  return (
    <div className="flex flex-wrap gap-5 p-5">
      <aside className="flex min-h-[860px] w-[232px] flex-none flex-col gap-1 rounded-3xl border border-bd bg-card p-[18px]">
        <div className="flex items-center gap-2.5 px-2 pb-4 text-ac"><Sprout size={28} /><b className="text-tx">RiskOps</b></div>
        {me.tabs.map(t => { const I = ICONS[t.icon]; const on = path === '/dashboard/' + t.key;
          return <Link key={t.key} href={'/dashboard/' + t.key} className={`${nav} ${on ? 'bg-so font-semibold text-ac' : 'text-mu'}`}><I size={20} />{t.label}</Link>; })}
        <Link href="/dashboard/settings" className={`${nav} mt-auto text-mu`}><Settings size={20} />Settings</Link>
        <button onClick={() => { a.signOut(); router.push('/login'); }} className={`${nav} text-mu`}><LogOut size={20} />Sign out</button>
      </aside>
      <main className="flex min-w-0 flex-[999_1_560px] flex-col gap-[18px]">
        <header className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ac font-bold text-on">{me.label.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
            <div><div className="text-[14px] font-semibold">{me.name}</div><div className="text-[12.5px] text-mu">{me.label} · {me.branch}</div></div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {canSeeHealth(a.role) && <span className="num rounded-full bg-so px-3.5 py-2.5 text-[11.5px] font-semibold text-ac">Live System · 6,362,620 records</span>}
            <button onClick={() => a.setDark(!a.dark)} className="flex h-11 items-center gap-2 rounded-full border border-bd bg-card px-3.5 text-[13px] font-semibold">{a.dark ? <Sun size={16} /> : <Moon size={16} />}{a.dark ? 'Light' : 'Dark'}</button>
            <button aria-label="Notifications" onClick={() => a.role === 'senior' ? router.push('/dashboard/esc') : a.say('No new notifications')} className="relative flex h-11 w-11 items-center justify-center rounded-full border border-bd bg-card">
              <Bell size={20} />{bellOn && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rd" />}</button>
          </div>
        </header>
        {a.toast && <div role="status" className="anim-sl fixed right-7 top-6 z-50 rounded-2xl bg-ac px-5 py-3.5 text-[13.5px] font-semibold text-on">{a.toast}</div>}
        {children}
      </main>
    </div>
  );
}
