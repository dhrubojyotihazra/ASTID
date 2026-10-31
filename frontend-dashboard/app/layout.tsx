import './globals.css';
import { AppProvider } from '@/lib/store';
import { GradientWave } from '@/components/ui/gradient-wave';

export const metadata = {
  title: 'ASTID',
  description: 'AI Shield for Transaction Integrity & Defense | Bank Fraud Operations Workbench',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
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
