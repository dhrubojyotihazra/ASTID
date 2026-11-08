import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '404 - Page Not Found | ASTID',
  description: 'Oops! Airball. We could not find the page you are looking for.',
};

export default function NotFound() {
  return (
    <main className="fixed inset-0 z-50 w-screen h-screen overflow-hidden bg-[#0d0d0d]">
      <iframe
        src="/404/index.html"
        title="404 - Hoopshot"
        className="w-full h-full border-0 block"
        allow="autoplay; fullscreen"
      />
      <noscript>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white text-center">
          <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
          <p className="text-zinc-400 mb-6">We could not find the page you were looking for.</p>
          <Link href="/" className="px-6 py-2 rounded-full bg-white text-black font-medium">
            Return to Dashboard
          </Link>
        </div>
      </noscript>
    </main>
  );
}
