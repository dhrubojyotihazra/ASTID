'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sprout, Moon, Sun } from 'lucide-react';
import { useApp } from '@/lib/store';
import { ROLES, emailToRole } from '@/lib/roles';
import { Role } from '@/lib/data';
import { Btn, Card } from '@/components/ui';

export default function Login() {
  const a = useApp(); const router = useRouter();
  const [email, setEmail] = useState(''); const [pw, setPw] = useState('');
  const go = (r: Role) => { a.signIn(r); router.push('/dashboard/' + ROLES[r].tabs[0].key); }; // land on own home
  // TODO: replace emailToRole with supabase.auth.signInWithPassword({email,password}) and read role from users table
  return (
    <main className="relative flex min-h-screen items-center justify-center p-6">
      <button onClick={() => a.setDark(!a.dark)} className="absolute right-5 top-5 flex h-11 items-center gap-2 rounded-full border border-bd bg-card px-4 text-[13px] font-semibold text-mu">
        {a.dark ? <Sun size={16} /> : <Moon size={16} />}{a.dark ? 'Light mode' : 'Dark mode'}</button>
      <Card className="anim-up flex w-[400px] max-w-full flex-col gap-3.5 !p-8">
        <div className="flex items-center gap-2.5 text-ac"><Sprout size={30} /><b className="text-[17px] text-tx">RiskOps Workbench</b></div>
        <div><div className="text-[26px] font-bold tracking-tight">Sign in</div><p className="mt-1 text-[13.5px] text-mu">Bank staff only. You will land on your own workspace.</p></div>
        <form className="flex flex-col gap-3.5" onSubmit={e => { e.preventDefault(); go(emailToRole(email)); }}>
          <label className="text-[12.5px] text-mu">Work email
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@bank.example" className="mt-1 min-h-[44px] w-full rounded-2xl border border-bd bg-card px-3.5 text-[14px] text-tx focus:outline-2 focus:outline-ac" /></label>
          <label className="text-[12.5px] text-mu">Password
            <input type="password" value={pw} onChange={e => setPw(e.target.value)} className="mt-1 min-h-[44px] w-full rounded-2xl border border-bd bg-card px-3.5 text-[14px] text-tx focus:outline-2 focus:outline-ac" /></label>
          <Btn type="submit">Sign in</Btn>
        </form>
        <p className="text-[12.5px] text-mu">Need access? Ask your Admin. Accounts are not self-service.</p>
        <div className="border-t border-bd pt-3">
          <label className="flex items-center gap-2.5 text-[12.5px] text-mu"><input type="checkbox" checked={a.demo} onChange={e => a.setDemo(e.target.checked)} />Viva demo mode (off for real use)</label>
          {a.demo && <div className="mt-3 grid grid-cols-2 gap-2">{(Object.keys(ROLES) as Role[]).map(r => <Btn key={r} v="s" onClick={() => go(r)}>{ROLES[r].label}</Btn>)}</div>}
        </div>
      </Card>
    </main>
  );
}
