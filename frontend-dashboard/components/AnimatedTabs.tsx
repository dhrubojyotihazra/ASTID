'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  count?: number | string;
  tone?: 'default' | 'r' | 'a';
}

interface AnimatedTabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export default function AnimatedTabs<T extends string = string>({
  tabs,
  activeId,
  onChange,
  className = '',
  size = 'md',
}: AnimatedTabsProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const updateIndicator = useCallback(() => {
    if (!containerRef.current) return;
    const activeBtn = containerRef.current.querySelector<HTMLButtonElement>(
      `button[data-tab-id="${activeId}"]`
    );
    if (activeBtn) {
      setIndicator({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
        opacity: 1,
      });
    } else {
      setIndicator(prev => ({ ...prev, opacity: 0 }));
    }
  }, [activeId]);

  useEffect(() => {
    updateIndicator();
    // Re-check after layout calculation
    const timer = setTimeout(updateIndicator, 50);

    const resizeObserver = new ResizeObserver(() => {
      updateIndicator();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateIndicator);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateIndicator);
    };
  }, [updateIndicator]);

  const py = size === 'sm' ? 'py-1' : 'py-1.5';
  const textSz = size === 'sm' ? 'text-[12px]' : 'text-[12.5px]';

  return (
    <div
      ref={containerRef}
      role="tablist"
      className={`relative inline-flex max-w-full items-center overflow-x-auto rounded-full border border-bd/80 bg-card p-1 shadow-xs no-scrollbar select-none ${className}`}
    >
      {/* ── Sliding Active Background Pill ── */}
      <div
        aria-hidden="true"
        className="absolute top-1 bottom-1 rounded-full bg-[#0d3a23] dark:bg-[#155a37] pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-sm will-change-transform"
        style={{
          transform: `translateX(${indicator.left}px)`,
          width: `${indicator.width}px`,
          opacity: indicator.opacity,
          boxShadow: '0 2px 8px rgba(13, 58, 35, 0.35)',
        }}
      />

      {/* ── Tab Buttons ── */}
      {tabs.map(tab => {
        const isActive = tab.id === activeId;

        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            data-tab-id={tab.id}
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative z-10 flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 ${py} ${textSz} font-semibold transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac ${
              isActive
                ? 'text-white font-bold'
                : 'text-mu hover:text-tx hover:bg-so/40 active:scale-[0.98]'
            }`}
          >
            <span>{tab.label}</span>

            {tab.count !== undefined && (
              <span
                className={`num flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-bold transition-colors duration-200 ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : tab.tone === 'r'
                    ? 'bg-rb text-rd'
                    : tab.tone === 'a'
                    ? 'bg-ab text-am'
                    : 'bg-so text-mu'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
