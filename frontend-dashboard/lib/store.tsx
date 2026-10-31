'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { BASE_CASES, BaseCase, Role } from './data';
import { ROLES } from './roles';

export type Case = BaseCase & { rem: number | null; res?: 'fraud' | 'fp'; claimed?: boolean; by?: Role };
type Over = { kind?: 'escalate'; due?: number; res?: 'fraud' | 'fp'; claimed?: boolean; by?: Role };
type Log = { t: string; who: string; what: string; id: string };
type Ctx = {
  ready: boolean; role: Role | null; tick: number; dark: boolean; demo: boolean; toast: string; selected: string | null;
  cases: Case[]; notes: Record<string, string[]>; log: Log[]; stats: { reviewed: number; fp: number; escalated: number };
  signIn: (r: Role) => void; signOut: () => void; setDark: (b: boolean) => void; setDemo: (b: boolean) => void;
  select: (id: string | null) => void; say: (m: string) => void; addNote: (id: string, t: string) => void;
  decide: (id: string, res: 'fraud' | 'fp') => void; escalate: (id: string) => void; claim: (id: string) => void;
};
const C = createContext<Ctx>(null as unknown as Ctx);
export const useApp = () => useContext(C);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [tick, setTick] = useState(0);
  const [dark, setDarkS] = useState(false);
  const [demo, setDemoS] = useState(false);
  const [toast, setToast] = useState('');
  const [selected, select] = useState<string | null>(null);
  const [over, setOver] = useState<Record<string, Over>>({});
  const [notes, setNotes] = useState<Record<string, string[]>>({});
  const [log, setLog] = useState<Log[]>([]);
  const [stats, setStats] = useState({ reviewed: 0, fp: 0, escalated: 0 });

  useEffect(() => { // restore demo session (swap for Supabase getSession())
    setRole((localStorage.getItem('ro_role') as Role) || null);
    setDarkS(localStorage.getItem('ro_dark') === '1'); setDemoS(localStorage.getItem('ro_demo') === '1'); setReady(true);
  }, []);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);
  useEffect(() => { const t = setInterval(() => setTick(x => x + 1), 1000); return () => clearInterval(t); }, []);

  const say = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); }, []);
  const cases = useMemo<Case[]>(() => BASE_CASES.map(c => {
    const o = over[c.id] || {}; const kind = o.kind || c.kind; const due = o.due ?? c.due;
    return { ...c, kind, rem: kind === 'escalate' && due !== undefined ? due - tick : null, res: o.res, claimed: o.claimed, by: o.by };
  }), [over, tick]);

  const patch = (id: string, p: Over, what: string) => {
    setOver(s => ({ ...s, [id]: { ...(s[id] || {}), ...p } }));
    setLog(l => [{ t: 'T+' + tick + 's', who: role ? ROLES[role].label : '', what, id }, ...l]);
  };
  const value: Ctx = {
    ready, role, tick, dark, demo, toast, selected, cases, notes, log, stats, say, select,
    signIn: r => { localStorage.setItem('ro_role', r); setRole(r); },
    signOut: () => { localStorage.removeItem('ro_role'); setRole(null); select(null); },
    setDark: b => { localStorage.setItem('ro_dark', b ? '1' : '0'); setDarkS(b); },
    setDemo: b => { localStorage.setItem('ro_demo', b ? '1' : '0'); setDemoS(b); },
    addNote: (id, t) => role && setNotes(n => ({ ...n, [id]: [...(n[id] || []), `${ROLES[role].label}: ${t}`] })),
    decide: (id, res) => { patch(id, { res, by: role! }, res === 'fp' ? 'Marked false positive' : 'Confirmed fraud'); setStats(s => ({ ...s, reviewed: s.reviewed + 1, fp: s.fp + (res === 'fp' ? 1 : 0) })); say('Decision saved'); },
    escalate: id => { patch(id, { kind: 'escalate', due: tick + 900, by: role! }, 'Escalated to Senior'); setStats(s => ({ ...s, reviewed: s.reviewed + 1, escalated: s.escalated + 1 })); say('Escalated. Senior Analysts notified.'); },
    claim: id => { patch(id, { claimed: true }, 'Claimed case'); say('Case claimed'); },
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}
