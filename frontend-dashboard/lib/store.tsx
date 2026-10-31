'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { BASE_CASES, BaseCase, Role } from './data';
import { ROLES } from './roles';

export type Case = BaseCase & { rem: number | null; res?: 'fraud' | 'fp'; claimed?: boolean; by?: Role };
type Over = { kind?: 'escalate'; due?: number; res?: 'fraud' | 'fp'; claimed?: boolean; by?: Role };
type Log = { t: string; who: string; what: string; id: string };

type Ctx = {
  ready: boolean;
  role: Role | null;
  tick: number;
  dark: boolean;
  demo: boolean;
  toast: string;
  selected: string | null;
  cases: Case[];
  notes: Record<string, string[]>;
  log: Log[];
  stats: { reviewed: number; fp: number; escalated: number };
  signIn: (r: Role) => void;
  signOut: () => void;
  setDark: (b: boolean, event?: React.MouseEvent | MouseEvent) => void;
  toggleTheme: (event?: React.MouseEvent | MouseEvent) => void;
  setDemo: (b: boolean) => void;
  select: (id: string | null) => void;
  say: (m: string) => void;
  addNote: (id: string, t: string) => void;
  decide: (id: string, res: 'fraud' | 'fp') => void;
  escalate: (id: string) => void;
  claim: (id: string) => void;
};

const C = createContext<Ctx>(null as unknown as Ctx);
export const useApp = () => useContext(C);

function triggerWaveRipple(x: number, y: number, nextDark: boolean) {
  if (typeof document === 'undefined') return;
  const ripple = document.createElement('div');
  ripple.className = 'theme-wave-ripple';
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.style.borderColor = nextDark ? '#5dbd8b' : '#0d3a23';
  ripple.style.boxShadow = nextDark
    ? '0 0 55px 16px rgba(93, 189, 139, 0.45), inset 0 0 35px rgba(93, 189, 139, 0.25)'
    : '0 0 55px 16px rgba(13, 58, 35, 0.35), inset 0 0 35px rgba(13, 58, 35, 0.2)';
  document.body.appendChild(ripple);
  setTimeout(() => {
    ripple.remove();
  }, 750);
}

function triggerFallbackWave(x: number, y: number, nextDark: boolean, onDone: () => void) {
  if (typeof document === 'undefined') {
    onDone();
    return;
  }
  const wave = document.createElement('div');
  wave.className = 'theme-fallback-wave';
  wave.style.left = `${x}px`;
  wave.style.top = `${y}px`;
  wave.style.backgroundColor = nextDark ? '#0E1411' : '#F4F5F1';
  document.body.appendChild(wave);

  setTimeout(() => {
    onDone();
    wave.style.opacity = '0';
    setTimeout(() => {
      wave.remove();
    }, 300);
  }, 500);
}

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

  useEffect(() => {
    setRole((localStorage.getItem('ro_role') as Role) || null);
    const isDark = localStorage.getItem('ro_dark') === '1';
    setDarkS(isDark);
    document.documentElement.classList.toggle('dark', isDark);
    setDemoS(localStorage.getItem('ro_demo') === '1');
    setReady(true);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const switchThemeWithWave = useCallback((targetDark: boolean, event?: React.MouseEvent | MouseEvent) => {
    // Determine click coordinates (or center of button, or center of screen)
    let x = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
    let y = typeof window !== 'undefined' ? window.innerHeight / 2 : 0;

    if (event && event.clientX !== undefined && event.clientY !== undefined) {
      x = event.clientX;
      y = event.clientY;
    } else if (event && (event.currentTarget as HTMLElement)?.getBoundingClientRect) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }

    // Trigger glowing wave ripple line
    triggerWaveRipple(x, y, targetDark);

    // If View Transitions API is supported by the browser
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const transition = (document as any).startViewTransition(() => {
        flushSync(() => {
          localStorage.setItem('ro_dark', targetDark ? '1' : '0');
          setDarkS(targetDark);
        });
        document.documentElement.classList.toggle('dark', targetDark);
      });

      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 650,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      });
    } else {
      // Fallback for browsers without View Transitions
      triggerFallbackWave(x, y, targetDark, () => {
        localStorage.setItem('ro_dark', targetDark ? '1' : '0');
        setDarkS(targetDark);
        document.documentElement.classList.toggle('dark', targetDark);
      });
    }
  }, []);

  const setDark = useCallback((b: boolean, event?: React.MouseEvent | MouseEvent) => {
    switchThemeWithWave(b, event);
  }, [switchThemeWithWave]);

  const toggleTheme = useCallback((event?: React.MouseEvent | MouseEvent) => {
    switchThemeWithWave(!dark, event);
  }, [dark, switchThemeWithWave]);

  const say = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(''), 3000);
  }, []);

  const cases = useMemo<Case[]>(() => BASE_CASES.map(c => {
    const o = over[c.id] || {};
    const kind = o.kind || c.kind;
    const due = o.due ?? c.due;
    return {
      ...c,
      kind,
      rem: kind === 'escalate' && due !== undefined ? due - tick : null,
      res: o.res,
      claimed: o.claimed,
      by: o.by,
    };
  }), [over, tick]);

  const patch = (id: string, p: Over, what: string) => {
    setOver(s => ({ ...s, [id]: { ...(s[id] || {}), ...p } }));
    setLog(l => [{ t: 'T+' + tick + 's', who: role ? ROLES[role].label : '', what, id }, ...l]);
  };

  const value: Ctx = {
    ready,
    role,
    tick,
    dark,
    demo,
    toast,
    selected,
    cases,
    notes,
    log,
    stats,
    say,
    select,
    signIn: r => { localStorage.setItem('ro_role', r); setRole(r); },
    signOut: () => { localStorage.removeItem('ro_role'); setRole(null); select(null); },
    setDark,
    toggleTheme,
    setDemo: b => { localStorage.setItem('ro_demo', b ? '1' : '0'); setDemoS(b); },
    addNote: (id, t) => role && setNotes(n => ({ ...n, [id]: [...(n[id] || []), `${ROLES[role].label}: ${t}`] })),
    decide: (id, res) => {
      patch(id, { res, by: role! }, res === 'fp' ? 'Marked false positive' : 'Confirmed fraud');
      setStats(s => ({ ...s, reviewed: s.reviewed + 1, fp: s.fp + (res === 'fp' ? 1 : 0) }));
      say('Decision saved');
    },
    escalate: id => {
      patch(id, { kind: 'escalate', due: tick + 900, by: role! }, 'Escalated to Senior');
      setStats(s => ({ ...s, reviewed: s.reviewed + 1, escalated: s.escalated + 1 }));
      say('Escalated. Senior Analysts notified.');
    },
    claim: id => {
      patch(id, { claimed: true }, 'Claimed case');
      say('Case claimed');
    },
  };

  return <C.Provider value={value}>{children}</C.Provider>;
}
