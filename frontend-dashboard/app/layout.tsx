import './globals.css';
import { AppProvider } from '@/lib/store';
import { GradientWave } from '@/components/ui/gradient-wave';

export const metadata = {
  title: 'Sentinel RiskOps | Bank Fraud Operations Workbench',
  description: 'Internal Enterprise Financial Risk Operations and Transaction Inspection Workbench',
};

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="relative min-h-screen">
        {/* Animated WebGL Gradient Wave Background (Forest Green Light/Dark) */}
        <GradientWave
          mode="auto"
          isPlaying
          shadowPower={6}
          noiseSpeed={0.000012}
          style={{ position: 'fixed', inset: 0, zIndex: 0 }}
        />
        <div className="relative z-10 min-h-screen">
          <AppProvider>{children}</AppProvider>
        </div>
      </body>
    </html>
  );
}
