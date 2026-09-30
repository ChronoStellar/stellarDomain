"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { withBasePath } from '@/lib/basePath';

const getRandomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const BB_QUOTES = [
  "Hey! I'm swimming here! 🫧",
  "0G is no excuse for poking!",
  "BB to ground control: visitor detected in Sector Lab! 📡",
  "Warning: cosmic tickle shields offline! ⚡",
  "Bloop bloop... looking for space snacks 🍙",
  "✨ *streamlined cat-astronaut glide* ✨",
  "Don't tap the glass, you'll scare the space duck! 🦆",
  "Systems nominal! Proceed with research!",
  "0% gravity, 100% aerodynamic.",
  "Need a rubber duck to debug your code? Check behind me!",
  "Brrr... deep space is cold, keep swimming! 🚀",
];

interface SwimmerStatus {
  active: boolean;
  direction: 'ltr' | 'rtl';
  spawnY: number;
  duration: number;
}

/**
 * Ambient space swimmers in the background of The Lab:
 * - Bound to the whole scrollable page height (not pinned to the screen viewport).
 * - Rare single-pass traverses with long idle cooldowns between appearances.
 * - BB has an interactive Easter egg: Click repeatedly in quick succession to chat!
 */
export default function SpaceSwimmer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const customLaneRef = useRef<HTMLDivElement>(null);
  const primaryLaneRef = useRef<HTMLDivElement>(null);
  const secondaryLaneRef = useRef<HTMLDivElement>(null);

  // Swimmer spawn states
  const [bbState, setBbState] = useState<SwimmerStatus>({
    active: false,
    direction: 'ltr',
    spawnY: 180,
    duration: 48,
  });

  const [primaryState, setPrimaryState] = useState<SwimmerStatus>({
    active: false,
    direction: 'ltr',
    spawnY: 380,
    duration: 52,
  });

  const [secondaryState, setSecondaryState] = useState<SwimmerStatus>({
    active: false,
    direction: 'rtl',
    spawnY: 620,
    duration: 62,
  });

  // Dialogue & click interaction
  const [speech, setSpeech] = useState<string | null>(null);
  const [isPoked, setIsPoked] = useState(false);
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pokeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Spawn cooldown timer refs
  const bbTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const primaryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const secondaryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Measure total page height to spawn across the full document
  const pickSpawnY = useCallback((minY = 140, bottomOffset = 220) => {
    let pageHeight = 1200;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.height > 200) {
        pageHeight = rect.height;
      }
    } else if (typeof document !== 'undefined') {
      pageHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        1000
      );
    }
    const maxY = Math.max(minY + 60, pageHeight - bottomOffset);
    return getRandomInt(minY, maxY);
  }, []);

  const pickDuration = useCallback((baseSeconds: number) => {
    if (typeof window === 'undefined') return baseSeconds;
    const w = window.innerWidth || 1200;
    return Math.max(28, Math.min(65, Math.round((w / 1100) * baseSeconds)));
  }, []);

  // --- BB Lifecycle ---
  const spawnBb = useCallback(() => {
    const dir: 'ltr' | 'rtl' = Math.random() > 0.5 ? 'ltr' : 'rtl';
    const y = pickSpawnY(120, 220);
    const dur = pickDuration(46);

    setBbState({
      active: true,
      direction: dir,
      spawnY: y,
      duration: dur,
    });
  }, [pickSpawnY, pickDuration]);

  const scheduleNextBb = useCallback(() => {
    if (bbTimeoutRef.current) clearTimeout(bbTimeoutRef.current);
    // Rare cooldown: 45s - 90s between appearances
    const cooldown = getRandomInt(45000, 90000);
    bbTimeoutRef.current = setTimeout(spawnBb, cooldown);
  }, [spawnBb]);

  const handleBbAnimationEnd = useCallback(() => {
    if (speech) {
      return;
    }
    setBbState((s) => ({ ...s, active: false }));
    scheduleNextBb();
  }, [speech, scheduleNextBb]);

  // --- Primary Pixel Swimmer Lifecycle ---
  const spawnPrimary = useCallback(() => {
    const dir: 'ltr' | 'rtl' = Math.random() > 0.5 ? 'ltr' : 'rtl';
    const y = pickSpawnY(160, 240);
    const dur = pickDuration(52);

    setPrimaryState({
      active: true,
      direction: dir,
      spawnY: y,
      duration: dur,
    });
  }, [pickSpawnY, pickDuration]);

  const scheduleNextPrimary = useCallback(() => {
    if (primaryTimeoutRef.current) clearTimeout(primaryTimeoutRef.current);
    // Rare cooldown: 60s - 130s between appearances
    const cooldown = getRandomInt(60000, 130000);
    primaryTimeoutRef.current = setTimeout(spawnPrimary, cooldown);
  }, [spawnPrimary]);

  const handlePrimaryAnimationEnd = useCallback(() => {
    setPrimaryState((s) => ({ ...s, active: false }));
    scheduleNextPrimary();
  }, [scheduleNextPrimary]);

  // --- Distant Floater Lifecycle ---
  const spawnSecondary = useCallback(() => {
    const dir: 'ltr' | 'rtl' = Math.random() > 0.5 ? 'ltr' : 'rtl';
    const y = pickSpawnY(220, 260);
    const dur = pickDuration(62);

    setSecondaryState({
      active: true,
      direction: dir,
      spawnY: y,
      duration: dur,
    });
  }, [pickSpawnY, pickDuration]);

  const scheduleNextSecondary = useCallback(() => {
    if (secondaryTimeoutRef.current) clearTimeout(secondaryTimeoutRef.current);
    // Rare cooldown: 80s - 180s between appearances
    const cooldown = getRandomInt(80000, 180000);
    secondaryTimeoutRef.current = setTimeout(spawnSecondary, cooldown);
  }, [spawnSecondary]);

  const handleSecondaryAnimationEnd = useCallback(() => {
    setSecondaryState((s) => ({ ...s, active: false }));
    scheduleNextSecondary();
  }, [scheduleNextSecondary]);

  // Initial delayed mount scheduling
  useEffect(() => {
    // BB appears after an initial 4s ambient delay
    bbTimeoutRef.current = setTimeout(spawnBb, 4000);
    // Primary pixel swimmer spawns after ~28s
    primaryTimeoutRef.current = setTimeout(spawnPrimary, 28000);
    // Distant duck companion spawns after ~65s
    secondaryTimeoutRef.current = setTimeout(spawnSecondary, 65000);

    return () => {
      if (bbTimeoutRef.current) clearTimeout(bbTimeoutRef.current);
      if (primaryTimeoutRef.current) clearTimeout(primaryTimeoutRef.current);
      if (secondaryTimeoutRef.current) clearTimeout(secondaryTimeoutRef.current);
    };
  }, [spawnBb, spawnPrimary, spawnSecondary]);

  // Rapid click / poke handler for BB
  const handleBbClick = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation();
      const now = Date.now();
      const timeSinceLast = now - lastClickTimeRef.current;
      lastClickTimeRef.current = now;

      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }

      // Count clicks that happen within 550ms of each other
      if (timeSinceLast < 550) {
        clickCountRef.current += 1;
      } else {
        clickCountRef.current = 1;
      }

      // Reset counter after 750ms of idle
      resetTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 750);

      // Visual poke feedback on every click
      setIsPoked(true);
      if (pokeTimerRef.current) clearTimeout(pokeTimerRef.current);
      pokeTimerRef.current = setTimeout(() => {
        setIsPoked(false);
      }, 260);

      // Trigger speech on 3 quick clicks (or immediately if already speaking)
      if (clickCountRef.current >= 3 || speech !== null) {
        setSpeech((prev) => {
          const pool = BB_QUOTES.filter((q) => q !== prev);
          return pool[Math.floor(Math.random() * pool.length)] || BB_QUOTES[0];
        });

        if (dismissTimerRef.current) {
          clearTimeout(dismissTimerRef.current);
        }
        dismissTimerRef.current = setTimeout(() => {
          setSpeech(null);
          clickCountRef.current = 0;
          setBbState((s) => {
            if (!s.active) {
              scheduleNextBb();
            }
            return s;
          });
        }, 4200);
      }
    },
    [speech, scheduleNextBb]
  );

  // Clean up all click timers on unmount
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (pokeTimerRef.current) clearTimeout(pokeTimerRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="space-swimmer-bg">
      {/* BB: Custom Swimming Astronaut */}
      {bbState.active && (
        <div
          ref={customLaneRef}
          className={`custom-astro-lane swim-${bbState.direction} ${speech ? 'is-speaking' : ''}`}
          style={{
            top: `${bbState.spawnY}px`,
            '--duration': `${bbState.duration}s`,
          } as React.CSSProperties}
          onAnimationEnd={handleBbAnimationEnd}
          aria-label="BB the astronaut swimming in space"
        >
          {/* Retro Speech Bubble (renders upright above BB) */}
          {speech && (
            <div className="bb-speech-bubble" role="status" aria-live="polite">
              <span className="bb-speech-author">BB:</span>
              <span className="bb-speech-text">{speech}</span>
              <div className="bb-speech-arrow" aria-hidden="true" />
            </div>
          )}

          <button
            type="button"
            className={`custom-astro-swimmer custom-astro-btn orient-${bbState.direction} ${isPoked ? 'bb-poked' : ''}`}
            onClick={handleBbClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleBbClick(e);
              }
            }}
            title="Click BB repeatedly in quick succession!"
            aria-label="BB the astronaut swimmer. Click rapidly to talk."
          >
            {/* Frame 1: Swimming stroke & kick */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={withBasePath('/lab/astro-swim-1.webp')}
              alt="BB swimming stroke"
              className="custom-astro-frame frame-stroke"
              decoding="async"
            />
            {/* Frame 2: Streamlined glide */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={withBasePath('/lab/astro-swim-2.webp')}
              alt="BB streamlined glide"
              className="custom-astro-frame frame-glide"
              decoding="async"
            />
          </button>
        </div>
      )}

      {/* Retro Pixel Swimmer 1: 8-bit Astronaut with snorkel and pool floaties */}
      {primaryState.active && (
        <div
          ref={primaryLaneRef}
          className={`pixel-astronaut-lane swim-${primaryState.direction}`}
          style={{
            top: `${primaryState.spawnY}px`,
            '--duration': `${primaryState.duration}s`,
          } as React.CSSProperties}
          onAnimationEnd={handlePrimaryAnimationEnd}
          aria-hidden="true"
        >
          <div className={`pixel-swimmer swimmer-breaststroke pixel-orient-${primaryState.direction}`}>
            <svg
              className="pixel-astro-svg"
              viewBox="0 0 24 20"
              shapeRendering="crispEdges"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Snorkel */}
              <rect x="7" y="0" width="2" height="1" fill="#ef4444" />
              <rect x="7" y="1" width="2" height="1" fill="#ffffff" />
              <rect x="7" y="2" width="2" height="1" fill="#ef4444" />
              <rect x="8" y="2" width="2" height="1" fill="#ef4444" />

              {/* Snorkel Pixel Bubbles */}
              <g className="pixel-bubble-stream">
                <rect x="5" y="0" width="1" height="1" fill="#7dd3fc" />
                <rect x="3" y="-2" width="1" height="1" fill="#bae6fd" />
              </g>

              {/* Backpack */}
              <rect x="4" y="6" width="3" height="7" fill="#64748b" />
              <rect x="3" y="7" width="1" height="5" fill="#475569" />

              {/* Helmet */}
              <rect x="8" y="3" width="7" height="1" fill="#f1f5f9" />
              <rect x="7" y="4" width="9" height="4" fill="#f1f5f9" />
              <rect x="10" y="4" width="5" height="3" fill="#f59e0b" />
              <rect x="11" y="4" width="2" height="1" fill="#fef08a" />
              <rect x="8" y="7" width="7" height="1" fill="#94a3b8" />

              {/* Torso */}
              <rect x="7" y="8" width="7" height="5" fill="#f8fafc" />
              <rect x="9" y="9" width="1" height="1" fill="#0284c7" />
              <rect x="11" y="9" width="1" height="1" fill="#22c55e" />
              <rect x="10" y="11" width="2" height="1" fill="#64748b" />

              {/* Left Arm & Floatie */}
              <g className="pixel-arm-top">
                <rect x="8" y="6" width="3" height="2" fill="#f97316" />
                <rect x="9" y="6" width="1" height="2" fill="#fdba74" />
                <rect x="11" y="6" width="4" height="2" fill="#f8fafc" />
                <rect x="15" y="6" width="2" height="2" fill="#475569" />
              </g>

              {/* Right Arm & Floatie */}
              <g className="pixel-arm-bottom">
                <rect x="8" y="12" width="3" height="2" fill="#f97316" />
                <rect x="9" y="12" width="1" height="2" fill="#fdba74" />
                <rect x="11" y="12" width="4" height="2" fill="#f8fafc" />
                <rect x="15" y="12" width="2" height="2" fill="#475569" />
              </g>

              {/* Legs */}
              <g className="pixel-legs">
                <rect x="5" y="12" width="3" height="3" fill="#e2e8f0" />
                <rect x="3" y="13" width="2" height="2" fill="#f8fafc" />
                <rect x="1" y="14" width="2" height="2" fill="#334155" />
                <rect x="4" y="15" width="2" height="2" fill="#e2e8f0" />
                <rect x="2" y="17" width="2" height="2" fill="#475569" />
              </g>
            </svg>
          </div>
        </div>
      )}

      {/* Distant Floater: Tiny astronaut & rubber ducky peacefully floating in zero-G */}
      {secondaryState.active && (
        <div
          ref={secondaryLaneRef}
          className={`pixel-astronaut-lane lane-secondary swim-${secondaryState.direction}`}
          style={{
            top: `${secondaryState.spawnY}px`,
            '--duration': `${secondaryState.duration}s`,
          } as React.CSSProperties}
          onAnimationEnd={handleSecondaryAnimationEnd}
          aria-hidden="true"
        >
          <div className={`pixel-swimmer floater-companion floater-orient-${secondaryState.direction}`}>
            <svg
              className="pixel-astro-svg-small"
              viewBox="0 0 28 16"
              shapeRendering="crispEdges"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Tiny Space Rubber Ducky */}
              <g className="pixel-ducky-companion">
                <rect x="2" y="5" width="4" height="4" fill="#38bdf8" fillOpacity="0.4" />
                <rect x="3" y="4" width="2" height="1" fill="#bae6fd" fillOpacity="0.6" />
                <rect x="3" y="6" width="3" height="2" fill="#facc15" />
                <rect x="1" y="8" width="4" height="2" fill="#eab308" />
                <rect x="6" y="6" width="1" height="1" fill="#f97316" />
              </g>

              {/* Distant Swimmer */}
              <g transform="translate(10, 0)">
                <rect x="6" y="2" width="5" height="4" fill="#f1f5f9" />
                <rect x="8" y="3" width="3" height="2" fill="#38bdf8" />
                <rect x="3" y="4" width="2" height="4" fill="#64748b" />
                <rect x="5" y="6" width="5" height="4" fill="#f8fafc" />
                <rect x="6" y="5" width="2" height="1" fill="#f97316" />
                <rect x="6" y="10" width="2" height="1" fill="#f97316" />
                <rect x="10" y="5" width="2" height="1" fill="#475569" />
                <rect x="10" y="9" width="2" height="1" fill="#475569" />
                <rect x="2" y="8" width="2" height="2" fill="#334155" />
                <rect x="1" y="10" width="2" height="2" fill="#475569" />
              </g>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
