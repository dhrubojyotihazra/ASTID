import './globals.css';
import { AppProvider } from '@/lib/store';
import { GradientWave } from '@/components/ui/gradient-wave';

export const metadata = {
  title: 'ASTID',
  description: 'AI Shield for Transaction Integrity & Defense | Bank Fraud Operations Workbench',
  icons: {
    icon: [
      { url: '/icon.png?v=5', type: 'image/png', sizes: '512x512' },
      { url: '/favicon.ico?v=5', sizes: 'any' },
    ],
    shortcut: '/favicon.ico?v=5',
    apple: '/icon.png?v=5',
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
