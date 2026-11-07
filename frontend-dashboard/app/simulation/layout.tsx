import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ASTID Simulation Studio | Standalone',
  description: 'ASTID Real-Time Attack Vector Simulator & Zero-Day Manifold Stress Testing Studio',
};

export default function SimulationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

