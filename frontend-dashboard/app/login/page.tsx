'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Moon, Sun, ArrowRight, UserCheck } from 'lucide-react';
import { useApp } from '@/lib/store';
import { ROLES, emailToRole } from '@/lib/roles';
import { Role } from '@/lib/data';
import { Btn, Card } from '@/components/ui';

export default function Login() {
  const a = useApp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');

  useEffect(() => {
    document.title = 'ASTID';
  }, []);

  const go = (r: Role) => {
    a.signIn(r);
    router.push('/dashboard/' + ROLES[r].tabs[0].key);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center p-6 bg-transparent">
      <button
        onClick={e => a.toggleTheme(e)}
        aria-label={a.dark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="absolute right-5 top-5 flex h-11 items-center gap-2 rounded-full border border-bd bg-card px-4 text-[13px] font-semibold text-mu hover:text-tx hover:border-ac/40 transition-all duration-200 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac cursor-pointer"
      >
        {a.dark ? <Sun size={16} /> : <Moon size={16} />}
        <span>{a.dark ? 'Light mode' : 'Dark mode'}</span>
      </button>

      <Card className="anim-up flex w-[440px] max-w-full flex-col gap-4 !p-8 shadow-md border-bd/80">
        <div className="flex items-center gap-2.5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-so/70 dark:bg-so/25 border border-ac/25 p-1.5 shadow-xs flex-shrink-0">
            <Image
              src="/astid-logo-square.png"
              alt="ASTID Logo"
              width={48}
              height={48}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col min-w-0 -ml-0.5">
            <Image
              src="/astid-wordmark.png"
              alt="astid"
              width={118}
              height={34}
              className="object-contain h-[32px] w-auto drop-shadow-xs"
              priority
            />
            <div className="text-[11.5px] font-medium text-mu mt-0.5">AI Shield for Transaction Integrity &amp; Defense</div>
          </div>
        </div>

        <div className="pt-1">
          <h1 className="text-[24px] font-bold tracking-tight text-tx">Sign In</h1>
          <p className="mt-1 text-[13px] text-mu">
            Authorized bank staff only. You will automatically route to your assigned branch scope.
          </p>
        </div>

        <form
          className="flex flex-col gap-3.5"
          onSubmit={e => {
            e.preventDefault();
            go(emailToRole(email));
          }}
        >
          <div>
            <label htmlFor="work-email" className="block text-[12.5px] font-medium text-mu mb-1">
              Work email address
            </label>
            <input
              id="work-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="investigator@bank.co.in"
              className="min-h-[44px] w-full rounded-2xl border border-bd bg-card px-3.5 text-[14px] text-tx transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac"
            />
          </div>

          <div>
            <label htmlFor="work-password" className="block text-[12.5px] font-medium text-mu mb-1">
              Password
            </label>
            <input
              id="work-password"
              type="password"
              autoComplete="current-password"
              required
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="••••••••••••"
              className="min-h-[44px] w-full rounded-2xl border border-bd bg-card px-3.5 text-[14px] text-tx transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac"
            />
          </div>

          <Btn type="submit" className="w-full mt-1">
            <span>Sign In to Workbench</span>
            <ArrowRight size={16} />
          </Btn>
        </form>

        <p className="text-[12px] text-mu">
          Need access credentials? Contact your System Administrator. User accounts are provisioned via enterprise Active Directory.
        </p>

        {/* Viva presentation role switcher */}
        <div className="border-t border-bd/70 pt-4 mt-1">
          <label className="flex items-center gap-2.5 text-[12.5px] font-medium text-mu cursor-pointer">
            <input
              type="checkbox"
              checked={a.demo}
              onChange={e => a.setDemo(e.target.checked)}
              className="h-4 w-4 rounded accent-[#0F5132]"
            />
            <span>Viva Examiner Demo Mode (Quick Role Switcher)</span>
          </label>

          {a.demo && (
            <div className="mt-3 flex flex-col gap-1.5 anim-up">
              <div className="text-[11.5px] font-bold uppercase tracking-wider text-mu mb-1">
                One-Click Security Boundary Demonstration:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(ROLES) as Role[]).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => go(r)}
                    className="flex flex-col items-start p-2.5 rounded-2xl border border-bd bg-so/30 hover:bg-so hover:border-ac/50 transition text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac"
                  >
                    <span className="text-[13px] font-bold text-tx">{ROLES[r].label}</span>
                    <span className="text-[11px] text-mu truncate w-full">{ROLES[r].branch}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </main>
  );
}
