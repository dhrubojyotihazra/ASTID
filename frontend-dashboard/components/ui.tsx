import { ReactNode, ButtonHTMLAttributes } from 'react';

export const Card = ({
  children,
  className = '',
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) => (
  <div
    className={`rounded-[22px] border border-bd bg-card p-5 transition ${
      interactive ? 'hover:-translate-y-0.5 hover:border-ac/40 cursor-pointer' : ''
    } ${className}`}
  >
    {children}
  </div>
);

export const Pill = ({
  children,
  tone = '',
  className = '',
}: {
  children: ReactNode;
  tone?: '' | 'r' | 'a' | 'b';
  className?: string;
}) => (
  <span
    className={`num inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold transition-colors ${
      tone === 'r'
        ? 'bg-rb text-rd border border-rd/25'
        : tone === 'a'
        ? 'bg-ab text-am border border-am/25'
        : tone === 'b'
        ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-bd'
        : 'bg-so text-ac border border-ac/25'
    } ${className}`}
  >
    {children}
  </span>
);

export function Btn({
  v = 'p',
  className = '',
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { v?: 'p' | 's' | 'd' }) {
  const c =
    v === 'p'
      ? 'bg-ac text-on border-ac hover:bg-ac/90 shadow-sm'
      : v === 'd'
      ? 'bg-rd text-card border-rd hover:bg-rd/90'
      : 'bg-transparent text-ac border-bd hover:bg-so hover:border-ac/50';

  return (
    <button
      {...p}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border px-5 text-[13.5px] font-semibold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${c} ${className}`}
    />
  );
}

export const H1 = ({ children }: { children: ReactNode }) => (
  <h1 className="text-[26px] font-bold tracking-tight text-tx">{children}</h1>
);

export const Stats = ({
  items,
}: {
  items: [string, string | number, string?][];
}) => (
  <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
    {items.map(([label, value, sub]) => (
      <Card key={label} className="anim-up">
        <div className="text-[12.5px] font-medium text-mu">{label}</div>
        <div className="num mt-1.5 text-[30px] font-bold tracking-tight text-tx">{value}</div>
        {sub && <div className="mt-1 text-[11.5px] text-mu">{sub}</div>}
      </Card>
    ))}
  </div>
);
