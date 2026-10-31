import type { Config } from 'tailwindcss';
const v = (n: string) => `var(--${n})`;
export default {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: { colors: { bg: v('bg'), card: v('cd'), bd: v('bd'), tx: v('tx'), mu: v('mu'), ac: v('ac'), on: v('on'), so: v('so'), rd: v('rd'), rb: v('rb'), am: v('am'), ab: v('ab') }, fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] } } },
} satisfies Config;
