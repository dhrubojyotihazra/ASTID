'use client';
import { useEffect, useState } from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';

export default function Preloader() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(15);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Check if user has already loaded in this tab session
    const hasPreloaded = sessionStorage.getItem('ro_preloaded');
    if (hasPreloaded) {
      setLoading(false);
      return;
    }

    const pTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(pTimer);
          setTimeout(() => {
            setExiting(true);
            setTimeout(() => {
              setLoading(false);
              sessionStorage.setItem('ro_preloaded', '1');
            }, 450);
          }, 200);
          return 100;
        }
        const delta = Math.floor(Math.random() * 25) + 15;
        return Math.min(100, prev + delta);
      });
    }, 120);

    return () => clearInterval(pTimer);
  }, []);

  if (!loading) return null;

  return (
    <div
      aria-label="Loading workspace"
      role="status"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F4F5F1] dark:bg-[#0E1411] transition-all duration-450 ease-[cubic-bezier(.22,1,.36,1)] ${
        exiting ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      <div className="relative flex flex-col items-center max-w-sm px-6 text-center">
        {/* Concentric pulsing rings */}
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute h-28 w-28 rounded-full border border-[#0F5132]/20 dark:border-[#6FBF8F]/20 animate-ping opacity-30" />
          <div className="absolute h-22 w-22 rounded-full border border-[#0F5132]/35 dark:border-[#6FBF8F]/35 animate-pulse" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#0d3a23] text-white shadow-xl">
            <ShieldCheck size={32} className="text-[#5dbd8b] animate-bounce" />
          </div>
        </div>

        {/* Brand name */}
        <h2 className="text-[20px] font-bold tracking-tight text-[#0E1A14] dark:text-[#EAF1EC] mb-1">
          Fernly <span className="text-[14px] font-medium text-[#646d67] dark:text-[#A3B3A9]">· RiskOps</span>
        </h2>
        <p className="text-[13px] text-[#646d67] dark:text-[#A3B3A9] mb-5">
          Everything your team is shipping, in one calm place.
        </p>

        {/* Loading Progress Bar */}
        <div className="w-48 h-1.5 overflow-hidden rounded-full bg-[#E3E6DF] dark:bg-[#26322C] mb-3">
          <div
            className="h-full bg-[#0F5132] dark:bg-[#6FBF8F] rounded-full transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#0F5132] dark:text-[#6FBF8F]">
          <Sparkles size={13} className="animate-spin" />
          <span>Synchronizing calm workspace {progress}%</span>
        </div>
      </div>
    </div>
  );
}
