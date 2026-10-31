import './globals.css';
import { AppProvider } from '@/lib/store';

export const metadata = {
  title: 'RiskOps Workbench | Bank Fraud Operations',
  description: 'Internal Enterprise B2B Financial Risk Operations and Transaction Inspection Workbench',
};

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
