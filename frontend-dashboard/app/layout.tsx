import './globals.css';
import { AppProvider } from '@/lib/store';
export const metadata = { title: 'RiskOps Workbench' };
export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><AppProvider>{children}</AppProvider></body></html>;
}
