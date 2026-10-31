'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX, ArrowRight } from 'lucide-react';

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

export default function Preloader() {
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);

  // Omni Curve Transition State
  const [isExiting, setIsExiting] = useState(false);
  const [topCurtainD, setTopCurtainD] = useState<string>('M -10 0 L 110 0 L 110 50 L -10 50 Z');
  const [botCurtainD, setBotCurtainD] = useState<string>('M -10 100 L 110 100 L 110 50 L -10 50 Z');
  const [trail1D, setTrail1D] = useState<string>('');
  const [trail2D, setTrail2D] = useState<string>('');
  const [trailOpacity, setTrailOpacity] = useState<number>(0);
  const [videoOpacity, setVideoOpacity] = useState<number>(1);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const exitStartedRef = useRef<boolean>(false);

  // Trigger Woblo Omni Curve Horizontal Centre Curtain Animation
  const triggerCurveExit = useCallback(() => {
    if (exitStartedRef.current) return;
    exitStartedRef.current = true;
    setIsExiting(true);

    const screenH = typeof window !== 'undefined' ? window.innerHeight || 800 : 800;
    const barThickness = 4; // px
    const slitY = ((barThickness / screenH) * 100) / 2; // half slit in SVG coords

    // Stage 1: Horizontal center slit opens (500ms)
    // Slit opens from center x=50 across to full width
    const slitDuration = 450;
    const slitStartTime = performance.now();

    function animateSlit(now: number) {
      const elapsed = now - slitStartTime;
      const p = Math.min(1, elapsed / slitDuration);
      const eased = easeOmni(p);

      // Slit expands horizontally: center stays at 50, edges expand from 50 to -10 and 110
      const leftX = 50 - 60 * eased;
      const rightX = 50 + 60 * eased;

      const topY = 50 - slitY * eased;
      const botY = 50 + slitY * eased;

      setTopCurtainD(`M -10 0 L 110 0 L 110 ${topY.toFixed(2)} L -10 ${topY.toFixed(2)} Z`);
      setBotCurtainD(`M -10 100 L 110 100 L 110 ${botY.toFixed(2)} L -10 ${botY.toFixed(2)} Z`);

      // Show initial glowing slit line
      if (eased > 0.1) {
        setTrailOpacity(Math.min(1, eased * 1.5));
        setTrail1D(`M ${leftX.toFixed(2)} 50 L ${rightX.toFixed(2)} 50`);
      }

      if (p < 1) {
        requestAnimationFrame(animateSlit);
      } else {
        // Slit opened. Brief 80ms pause then unmask with the signature Bell Curve
        setTimeout(startBellCurve, 60);
      }
    }

    // Stage 2: Bell curve sweeps open vertically past screen edges (750ms)
    function startBellCurve() {
      const curveDuration = 750;
      const curveStartTime = performance.now();

      function animateCurve(now: number) {
        const elapsed = now - curveStartTime;
        const p = Math.min(1, elapsed / curveDuration);
        const eased = easeOmni(p);

        // Echo trail 1 (Lead trail, #6FBF8F): offset 0ms
        const p1 = Math.min(1, Math.max(0, elapsed / (curveDuration * 0.9)));
        const e1 = easeOmni(p1);

        // Echo trail 2 (Mid trail, #BEF264): offset 50ms
        const p2 = Math.min(1, Math.max(0, (elapsed - 50) / (curveDuration * 0.9)));
        const e2 = easeOmni(p2);

        // Main curtain curve: offset 90ms
        const pMain = Math.min(1, Math.max(0, (elapsed - 90) / (curveDuration * 0.85)));
        const eMain = easeOmni(pMain);

        // Top curve boundary: pulls from y=50 up to edges: -200, center: -20
        const edgeYTop = (50 - slitY) + (-200 - (50 - slitY)) * eMain;
        const ctrlYTop = (50 - slitY) + (-20 - (50 - slitY)) * eMain;

        // Bottom curve boundary: pulls from y=50 down to edges: 300, center: 120
        const edgeYBot = (50 + slitY) + (300 - (50 + slitY)) * eMain;
        const ctrlYBot = (50 + slitY) + (120 - (50 + slitY)) * eMain;

        setTopCurtainD(
          `M -10 0 L 110 0 L 110 ${edgeYTop.toFixed(2)} C 75 ${ctrlYTop.toFixed(2)}, 25 ${ctrlYTop.toFixed(2)}, -10 ${edgeYTop.toFixed(2)} Z`
        );
        setBotCurtainD(
          `M -10 100 L 110 100 L 110 ${edgeYBot.toFixed(2)} C 75 ${ctrlYBot.toFixed(2)}, 25 ${ctrlYBot.toFixed(2)}, -10 ${edgeYBot.toFixed(2)} Z`
        );

        // Calculate Trail 1 curve
        const t1EdgeTop = (50 - slitY) + (-200 - (50 - slitY)) * e1;
        const t1CtrlTop = (50 - slitY) + (-20 - (50 - slitY)) * e1;
        const t1EdgeBot = (50 + slitY) + (300 - (50 + slitY)) * e1;
        const t1CtrlBot = (50 + slitY) + (120 - (50 + slitY)) * e1;

        setTrail1D(
          `M -10 ${t1EdgeTop.toFixed(2)} C 25 ${t1CtrlTop.toFixed(2)}, 75 ${t1CtrlTop.toFixed(2)}, 110 ${t1EdgeTop.toFixed(2)} M -10 ${t1EdgeBot.toFixed(2)} C 25 ${t1CtrlBot.toFixed(2)}, 75 ${t1CtrlBot.toFixed(2)}, 110 ${t1EdgeBot.toFixed(2)}`
        );

        // Calculate Trail 2 curve
        const t2EdgeTop = (50 - slitY) + (-200 - (50 - slitY)) * e2;
        const t2CtrlTop = (50 - slitY) + (-20 - (50 - slitY)) * e2;
        const t2EdgeBot = (50 + slitY) + (300 - (50 + slitY)) * e2;
        const t2CtrlBot = (50 + slitY) + (120 - (50 + slitY)) * e2;

        setTrail2D(
          `M -10 ${t2EdgeTop.toFixed(2)} C 25 ${t2CtrlTop.toFixed(2)}, 75 ${t2CtrlTop.toFixed(2)}, 110 ${t2EdgeTop.toFixed(2)} M -10 ${t2EdgeBot.toFixed(2)} C 25 ${t2CtrlBot.toFixed(2)}, 75 ${t2CtrlBot.toFixed(2)}, 110 ${t2EdgeBot.toFixed(2)}`
        );

        // Fade out video smoothly as curve sweeps open
        setVideoOpacity(Math.max(0, 1 - eMain * 1.8));

        if (pMain < 1) {
          requestAnimationFrame(animateCurve);
        } else {
          // Finished!
          setTrailOpacity(0);
          setTimeout(() => {
            setLoading(false);
          }, 50);
        }
      }

      requestAnimationFrame(animateCurve);
    }

    requestAnimationFrame(animateSlit);
  }, []);

  // Ensure video plays immediately on mount
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      video.playbackRate = 2.0; // 2x playback speed
      video.play().catch(() => {});
    }

    // Keyboard shortcut to skip
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
      setIsExiting(false);
      setLoading(true);
      setVideoOpacity(1);
      setTopCurtainD('M -10 0 L 110 0 L 110 50 L -10 50 Z');
      setBotCurtainD('M -10 100 L 110 100 L 110 50 L -10 50 Z');
      setTrail1D('');
      setTrail2D('');
      setTrailOpacity(0);

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

  // Video progress & auto trigger
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 4.96;
    setVideoProgress((current / dur) * 100);

    // Trigger transition when logo reveal finishes (~4.4s at 2x)
    if (current >= dur - 0.4 && !exitStartedRef.current) {
      triggerCurveExit();
    }
  };

  if (!loading) return null;

  return (
    <div
      aria-label="ASTID Reveal Preloader"
      className="fixed inset-0 z-[9999] overflow-hidden select-none"
    >
      {/* Woblo Omni Curve Curtains Layer: Top and Bottom SVG paths that part along the bell curve */}
      <svg
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full pointer-events-none z-30"
        aria-hidden="true"
      >
        {/* Top Curtain (sweeps up past y=0) */}
        <path fill="#0E1411" d={topCurtainD} />

        {/* Bottom Curtain (sweeps down past y=100) */}
        <path fill="#0E1411" d={botCurtainD} />

        {/* Echo Trail 1 (Lead trail: ASTID Emerald #6FBF8F, 3px stroke) */}
        {trailOpacity > 0 && trail1D && (
          <path
            fill="none"
            stroke="#6FBF8F"
            strokeWidth="0.8"
            strokeLinecap="round"
            opacity={trailOpacity}
            d={trail1D}
          />
        )}

        {/* Echo Trail 2 (Mid trail: ASTID Lime #BEF264, 2px stroke) */}
        {trailOpacity > 0 && trail2D && (
          <path
            fill="none"
            stroke="#BEF264"
            strokeWidth="0.5"
            strokeLinecap="round"
            opacity={trailOpacity * 0.85}
            d={trail2D}
          />
        )}
      </svg>

      {/* Video Reveal Stage: Displayed front-and-center on the preloader canvas */}
      <div
        className="relative z-10 flex h-full w-full flex-col items-center justify-center p-4 bg-[#0E1411] transition-opacity duration-300"
        style={{ opacity: videoOpacity }}
      >
        {/* High-definition Video Card */}
        <div className="relative w-full max-w-4xl aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isMuted}
            preload="auto"
            onLoadedMetadata={() => {
              if (videoRef.current) {
                videoRef.current.playbackRate = 2.0;
                videoRef.current.play().catch(() => {});
              }
            }}
            onTimeUpdate={handleTimeUpdate}
            onEnded={triggerCurveExit}
            className="w-full h-full object-contain"
          >
            <source src="/astid-reveal-2x.mp4" type="video/mp4" />
            <source
              src="/Logo_reveal_animation_a63dc0df_1080p (online-video-cutter.com).mp4"
              type="video/mp4"
            />
          </video>

          {/* Border highlight ring */}
          <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/15 rounded-3xl" />
        </div>

        {/* Footer controls: Audio toggle, timeline indicator, and Skip button */}
        <div className="mt-6 flex w-full max-w-4xl items-center justify-between px-4 text-xs text-white/70">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (videoRef.current) {
                  const nextMuted = !isMuted;
                  videoRef.current.muted = nextMuted;
                  setIsMuted(nextMuted);
                }
              }}
              className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 px-3 py-1.5 font-medium text-white transition-all cursor-pointer"
              aria-label={isMuted ? 'Unmute video audio' : 'Mute video audio'}
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} className="text-[#6FBF8F]" />}
              <span>{isMuted ? 'Unmute Audio' : 'Audio Active'}</span>
            </button>
            <span className="hidden sm:inline font-mono text-[11px] text-white/50">
              ASTID Reveal · 2.0× Speed
            </span>
          </div>

          {/* Progress bar and Skip button */}
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
