'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

const NUM_BARS = 5;
const BARS = Array.from({ length: NUM_BARS }, (_, i) => i);

export default function Preloader() {
  const [loading, setLoading] = useState(true);

  // Transition states
  const [isExiting, setIsExiting] = useState(false);
  const [barsSliding, setBarsSliding] = useState(false);
  const [frozenFrame, setFrozenFrame] = useState<string>('/last_frame.png');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const exitStartedRef = useRef<boolean>(false);

  // Trigger the multi-bar curtain up exit transition
  const triggerExit = useCallback(() => {
    if (exitStartedRef.current) return;
    exitStartedRef.current = true;

    const video = videoRef.current;
    if (video) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          setFrozenFrame(dataUrl);
        }
      } catch {
        setFrozenFrame('/last_frame.png');
      }
      video.pause();
    }

    // Step 1: Mount the curtain bars at translateY(0)
    setIsExiting(true);

    // Step 2: Trigger the upward sliding motion on the next paint tick
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setBarsSliding(true);
      });
    });

    // Step 3: Unmount after all bars finish sliding up (320ms delay + 800ms duration = 1120ms)
    setTimeout(() => {
      setLoading(false);
    }, 1200);
  }, []);

  // Ensure video plays immediately on mount
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      video.playbackRate = 2.0;
      video.play().catch(() => {});
    }

    // Keyboard shortcut or click anywhere to skip
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        triggerExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Global custom event to replay preloader anytime from UI
    const handleReplay = () => {
      exitStartedRef.current = false;
      setIsExiting(false);
      setBarsSliding(false);
      setLoading(true);

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
  }, [triggerExit]);

  // Video progress & auto trigger when near the end
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 4.98;

    // Auto-trigger curtain at the very last frame of the video
    if (current >= dur - 0.25 && !exitStartedRef.current) {
      triggerExit();
    }
  };

  if (!loading) return null;

  const bgGradient = 'linear-gradient(105deg, #d0d1cc 0%, #d4d5d0 50%, #b0b6b8 100%)';

  return (
    <div
      aria-label="ASTID Reveal Preloader"
      onClick={triggerExit}
      className="fixed inset-0 z-[9999] overflow-hidden select-none bg-[#d4d5d0] cursor-pointer"
    >
      {/* ── Active Video Layer (Edge-to-Edge True Fullscreen, Clean Cinematic) ── */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        preload="auto"
        onLoadedMetadata={() => {
          if (videoRef.current) {
            videoRef.current.playbackRate = 2.0;
            videoRef.current.play().catch(() => {});
          }
        }}
        onTimeUpdate={handleTimeUpdate}
        onEnded={triggerExit}
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
        style={{
          opacity: isExiting ? 0 : 1,
          transition: 'opacity 120ms ease-out',
        }}
      >
        <source src="/astid-reveal-2x.mp4" type="video/mp4" />
        <source
          src="/Logo_reveal_animation_a63dc0df_1080p (online-video-cutter.com).mp4"
          type="video/mp4"
        />
      </video>

      {/* ── Multiple Bars Curtain Up Layer (triggers on last frame / exit) ── */}
      {isExiting && (
        <div className="absolute inset-0 pointer-events-none z-30">
          {BARS.map(i => {
            const widthPct = 100 / NUM_BARS;
            const leftPct = i * widthPct;
            const delayMs = i * 80;

            return (
              <div
                key={i}
                className="absolute top-0 bottom-0 overflow-hidden"
                style={{
                  left: `${leftPct}%`,
                  width: `${widthPct + 0.15}%`, // tiny overlap prevents 1px subpixel seams
                  transform: barsSliding ? 'translateY(-100%)' : 'translateY(0%)',
                  transition: 'transform 800ms cubic-bezier(0.76, 0, 0.24, 1)',
                  transitionDelay: `${delayMs}ms`,
                  borderBottom: '3.5px solid #6FBF8F', // ASTID luminous emerald bottom trim
                  boxShadow: '0 25px 45px -5px rgba(0, 0, 0, 0.4)',
                  background: bgGradient,
                  willChange: 'transform',
                }}
              >
                {/* Inner screen clone: 100% matching edge-to-edge full viewport */}
                <div
                  className="absolute top-0 bottom-0"
                  style={{
                    left: `-${i * 100}%`,
                    width: `${NUM_BARS * 100}%`,
                    height: '100%',
                    background: bgGradient,
                  }}
                >
                  <img
                    src={frozenFrame}
                    alt="ASTID Reveal"
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
