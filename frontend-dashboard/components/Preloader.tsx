'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX, ArrowRight, Play } from 'lucide-react';

// Exact cubic-bezier(0.76, 0, 0.24, 1) ease evaluator from Woblo Omni Curve
function cubicBezier(p1x: number, p1y: number, p2x: number, p2y: number) {
  return function (t: number) {
    let s = t;
    for (let i = 0; i < 8; i++) {
      const currentX = 3 * (1 - s) * (1 - s) * s * p1x + 3 * (1 - s) * s * s * p2x + s * s * s;
      const dx = 3 * (1 - s) * (1 - s) * p1x + 6 * (1 - s) * s * (p2x - p1x) + 3 * s * s * (1 - p2x);
      if (Math.abs(dx) < 1e-6) break;
      s -= (currentX - t) / dx;
    }
    s = Math.max(0, Math.min(1, s));
    return 3 * (1 - s) * (1 - s) * s * p1y + 3 * (1 - s) * s * s * p2y + s * s * s;
  };
}

const easeOmni = cubicBezier(0.76, 0, 0.24, 1);

type Point = [number, number];

function interpPts(ptsA: Point[], ptsB: Point[], t: number): Point[] {
  return ptsA.map((a, i) => {
    const b = ptsB[i];
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  });
}

function ptsToD(p: Point[]): string {
  return `M ${p[0][0].toFixed(2)} ${p[0][1].toFixed(2)} C ${p[1][0].toFixed(2)} ${p[1][1].toFixed(2)}, ${p[2][0].toFixed(2)} ${p[2][1].toFixed(2)}, ${p[3][0].toFixed(2)} ${p[3][1].toFixed(2)} L ${p[4][0].toFixed(2)} ${p[4][1].toFixed(2)} C ${p[5][0].toFixed(2)} ${p[5][1].toFixed(2)}, ${p[6][0].toFixed(2)} ${p[6][1].toFixed(2)}, ${p[7][0].toFixed(2)} ${p[7][1].toFixed(2)} Z`;
}

export default function Preloader() {
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);

  // Omni Curve State
  const [maskPathD, setMaskPathD] = useState<string>('');
  const [trail1D, setTrail1D] = useState<string>('');
  const [trail2D, setTrail2D] = useState<string>('');
  const [trail1Op, setTrail1Op] = useState<number>(0);
  const [trail2Op, setTrail2Op] = useState<number>(0);
  const [videoOpacity, setVideoOpacity] = useState<number>(1);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animRunningRef = useRef<boolean>(false);
  const exitStartedRef = useRef<boolean>(false);

  // Start the Omni Curve Horizontal Centre transition
  const triggerCurveExit = useCallback(() => {
    if (exitStartedRef.current) return;
    exitStartedRef.current = true;

    const screenH = typeof window !== 'undefined' ? window.innerHeight || 800 : 800;
    const barThickness = 4; // px
    const halfY = ((barThickness / screenH) * 100) / 2;

    // Mathematical points for Horizontal Centre transition
    const Q: Point[] = [
      [50, 50 - halfY], [50, 50 - halfY], [50, 50 - halfY], [50, 50 - halfY],
      [50, 50 + halfY], [50, 50 + halfY], [50, 50 + halfY], [50, 50 + halfY],
    ];

    const S: Point[] = [
      [-10, 50 - halfY], [25, 50 - halfY], [75, 50 - halfY], [110, 50 - halfY],
      [110, 50 + halfY], [75, 50 + halfY], [25, 50 + halfY], [-10, 50 + halfY],
    ];

    const R: Point[] = [
      [-10, -200], [25, -20], [75, -20], [110, -200],
      [110, 300], [75, 120], [25, 120], [-10, 300],
    ];

    // Stage 1: Horizontal slit expands from center (Q -> S) in 550ms
    const slitDuration = 550;
    const slitStartTime = performance.now();

    function animateSlit(now: number) {
      const elapsed = now - slitStartTime;
      const progress = Math.min(1, elapsed / slitDuration);
      const eased = easeOmni(progress);
      const currentPts = interpPts(Q, S, eased);
      setMaskPathD(ptsToD(currentPts));

      if (progress < 1) {
        requestAnimationFrame(animateSlit);
      } else {
        // Slit opened. Brief 80ms pause then unmask with echo trails (S -> R)
        setTimeout(startCurveStage, 80);
      }
    }

    // Stage 2: Bell curve unmasks vertically (S -> R) with echo trails
    function startCurveStage() {
      const curveDuration = 800; // ms
      const curveStartTime = performance.now();
      setTrail1Op(1);
      setTrail2Op(1);

      function animateCurve(now: number) {
        const elapsed = now - curveStartTime;

        // Trail 1 (Lead trail, #6FBF8F): offset 0ms
        const p1 = Math.min(1, Math.max(0, elapsed / curveDuration));
        const e1 = easeOmni(p1);
        setTrail1D(ptsToD(interpPts(S, R, e1)));

        // Trail 2 (Mid trail, #BEF264): offset 50ms
        const p2 = Math.min(1, Math.max(0, (elapsed - 50) / curveDuration));
        const e2 = easeOmni(p2);
        setTrail2D(ptsToD(interpPts(S, R, e2)));

        // Main mask cutout: offset 100ms
        const pM = Math.min(1, Math.max(0, (elapsed - 100) / curveDuration));
        const eM = easeOmni(pM);
        setMaskPathD(ptsToD(interpPts(S, R, eM)));

        // Fade out video in sync with curve opening
        setVideoOpacity(Math.max(0, 1 - pM * 1.5));

        if (pM < 1) {
          requestAnimationFrame(animateCurve);
        } else {
          // Finished!
          setTrail1Op(0);
          setTrail2Op(0);
          setTimeout(() => {
            setLoading(false);
          }, 60);
        }
      }

      requestAnimationFrame(animateCurve);
    }

    requestAnimationFrame(animateSlit);
  }, []);

  // Initialize playback and listen for events
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = 2.0; // 2x speed as requested
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Browser prevented autoplay with sound, keep muted and retry
          video.muted = true;
          video.play().catch(() => {});
        });
      }
    }

    // Key shortcut to skip (Space or Enter or Escape)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        triggerCurveExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Global custom event to replay preloader anytime from UI
    const handleReplay = () => {
      exitStartedRef.current = false;
      setLoading(true);
      setVideoOpacity(1);
      setMaskPathD('');
      setTrail1D('');
      setTrail2D('');
      setTrail1Op(0);
      setTrail2Op(0);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.playbackRate = 2.0;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    };
    window.addEventListener('astid:replay-preloader', handleReplay);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('astid:replay-preloader', handleReplay);
    };
  }, [triggerCurveExit]);

  // Video progress and auto-exit trigger
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 4.98;
    setVideoProgress((current / dur) * 100);

    // Trigger curve transition right at the climax of the reveal (around 4.4s at 2x)
    if (current >= dur - 0.5 && !exitStartedRef.current) {
      triggerCurveExit();
    }
  };

  if (!loading) return null;

  return (
    <div
      aria-label="ASTID Reveal Preloader"
      className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto select-none bg-[#0E1411]"
    >
      {/* Omni Curve SVG Mask Overlay (Woblo Horizontal Centre) */}
      <svg
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
        aria-hidden="true"
      >
        <defs>
          <mask id="omni-curve-bell-mask">
            {/* White background: overlay remains opaque */}
            <rect x="0" y="0" width="100" height="100" fill="white" />
            {/* Animated black path cuts out the horizontal slit and curved bell */}
            {maskPathD && <path fill="black" d={maskPathD} />}
          </mask>
        </defs>

        {/* Group with bell mask cuts through the dark canvas */}
        <g mask="url(#omni-curve-bell-mask)">
          {/* Base full-page dark overlay */}
          <rect x="0" y="0" width="100" height="100" fill="#0E1411" />

          {/* Echo Trail 1 (Lead trail: ASTID Emerald #6FBF8F) */}
          {trail1Op > 0 && trail1D && (
            <path fill="#6FBF8F" opacity={trail1Op} d={trail1D} />
          )}

          {/* Echo Trail 2 (Mid trail: ASTID Lime #BEF264) */}
          {trail2Op > 0 && trail2D && (
            <path fill="#BEF264" opacity={trail2Op} d={trail2D} />
          )}
        </g>
      </svg>

      {/* Video Reveal Stage (Center aligned, 2x playback speed) */}
      <div
        className="relative z-10 flex h-full w-full flex-col items-center justify-center p-4 transition-opacity duration-300"
        style={{ opacity: videoOpacity }}
      >
        {/* Cinematic Video Card */}
        <div className="relative w-full max-w-4xl aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black/60 flex items-center justify-center">
          <video
            ref={videoRef}
            src="/astid-reveal-2x.mp4"
            autoPlay
            playsInline
            muted={isMuted}
            onTimeUpdate={handleTimeUpdate}
            onEnded={triggerCurveExit}
            className="w-full h-full object-contain"
          />

          {/* Subtle gradient vignette to blend with dark mode */}
          <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-3xl" />
        </div>

        {/* Footer controls: Audio toggle, timeline indicator, and Skip button */}
        <div className="mt-6 flex w-full max-w-4xl items-center justify-between px-4 text-xs text-white/70">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }
              }}
              className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 px-3 py-1.5 font-medium text-white transition-all cursor-pointer"
              aria-label={isMuted ? 'Unmute video audio' : 'Mute video audio'}
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} className="text-[#6FBF8F]" />}
              <span>{isMuted ? 'Unmute Sound' : 'Audio On'}</span>
            </button>
            <span className="hidden sm:inline font-mono text-[11px] text-white/50">
              2.0× Hardware Render
            </span>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="w-32 h-1 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full bg-[#6FBF8F] rounded-full transition-all duration-100 ease-out"
                style={{ width: `${videoProgress}%` }}
              />
            </div>

            <button
              onClick={triggerCurveExit}
              className="group flex items-center gap-1.5 rounded-full bg-[#0F5132] hover:bg-[#155A37] border border-[#6FBF8F]/30 px-3.5 py-1.5 font-semibold text-white transition-all shadow-md cursor-pointer active:scale-95"
            >
              <span>Skip to Workbench</span>
              <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
