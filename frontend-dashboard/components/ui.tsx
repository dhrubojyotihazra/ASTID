import { ReactNode, ButtonHTMLAttributes } from 'react';
export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) =>
  <div className={`rounded-[22px] border border-bd bg-card p-5 transition hover:-translate-y-0.5 ${className}`}>{children}</div>;
export const Pill = ({ children, tone = '' }: { children: ReactNode; tone?: '' | 'r' | 'a' }) =>
  <span className={`num whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${tone === 'r' ? 'bg-rb text-rd' : tone === 'a' ? 'bg-ab text-am' : 'bg-so text-ac'}`}>{children}</span>;
export function Btn({ v = 'p', className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { v?: 'p' | 's' | 'd' }) {
  const c = v === 'p' ? 'bg-ac text-on border-ac' : v === 'd' ? 'bg-rd text-card border-rd' : 'bg-transparent text-ac border-ac';
  return <button {...p} className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border px-5 text-[13.5px] font-semibold transition hover:-translate-y-0.5 disabled:opacity-50 ${c} ${className}`} />;
}
export const H1 = ({ children }: { children: ReactNode }) => <h1 className="text-[28px] font-bold tracking-tight">{children}</h1>;
export const Stats = ({ items }: { items: [string, string | number][] }) =>
  <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">{items.map(([l, v]) =>
    <Card key={l} className="anim-up"><div className="text-[12.5px] text-mu">{l}</div><div className="num mt-2 text-[32px] font-bold">{v}</div></Card>)}</div>;
